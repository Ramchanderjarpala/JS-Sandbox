import type { Express } from "express";
import { createServer, type Server } from "http";
import { executionRequestSchema, insertSnippetSchema, type TerminalOutput } from "@shared/schema";
import { storage } from "./storage";
import { Worker } from "worker_threads";
import { join } from "path";
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { z } from "zod";

interface OutputItem {
  type: "log" | "error" | "warn" | "info" | "result";
  content: string;
}

interface ExecutionResult {
  output: OutputItem[];
  error?: string;
  executionTime: number;
}

const EXECUTION_TIMEOUT = 5000;
const TEMP_DIR = "/tmp/js-playground";

if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true });
}

const workerCode = `
const { parentPort, workerData } = require('worker_threads');
const vm = require('vm');

function formatValue(value, depth = 0) {
  if (depth > 3) return '[...]';
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'function') return '[Function: ' + (value.name || 'anonymous') + ']';
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'object') {
    try {
      if (Array.isArray(value)) {
        if (value.length > 100) return '[Array(' + value.length + ')]';
        const items = value.slice(0, 20).map(v => formatValue(v, depth + 1));
        if (value.length > 20) items.push('... ' + (value.length - 20) + ' more');
        return '[' + items.join(', ') + ']';
      }
      const keys = Object.keys(value);
      if (keys.length > 20) return '{Object with ' + keys.length + ' keys}';
      return JSON.stringify(value, (k, v) => {
        if (typeof v === 'function') return '[Function]';
        if (typeof v === 'symbol') return v.toString();
        return v;
      }, 2);
    } catch {
      return '[Circular]';
    }
  }
  return String(value);
}

function formatArgs(args) {
  return args.map(v => formatValue(v)).join(' ');
}

const { code, mode } = workerData;
const output = [];
const startTime = Date.now();

const customConsole = {
  log: (...args) => output.push({ type: 'log', content: formatArgs(args) }),
  error: (...args) => output.push({ type: 'error', content: formatArgs(args) }),
  warn: (...args) => output.push({ type: 'warn', content: formatArgs(args) }),
  info: (...args) => output.push({ type: 'info', content: formatArgs(args) }),
  debug: (...args) => output.push({ type: 'log', content: formatArgs(args) }),
  table: (data) => output.push({ type: 'log', content: formatValue(data) }),
  clear: () => {},
  time: () => {},
  timeEnd: () => {},
  group: () => {},
  groupEnd: () => {},
  assert: (condition, ...args) => {
    if (!condition) output.push({ type: 'error', content: 'Assertion failed: ' + formatArgs(args) });
  },
  count: () => {},
  countReset: () => {},
  dir: (obj) => output.push({ type: 'log', content: formatValue(obj) }),
  trace: () => output.push({ type: 'log', content: new Error().stack }),
  // Polyfill browser globals if needed (could be expanded)
};

const sandbox = {
  console: customConsole,
  // ... (Other standard globals)
  JSON, Math, Date, Array, Object, String, Number, Boolean, RegExp, Error, 
  Map, Set, Promise
};

try {
  const context = vm.createContext(sandbox);
  const script = new vm.Script(code);
  const result = script.runInContext(context, { timeout: 5000 });
  
  if (result !== undefined) {
    output.push({ type: 'result', content: formatValue(result) });
  }

  const executionTime = Date.now() - startTime;
  parentPort.postMessage({ output, executionTime });
} catch (err) {
  const executionTime = Date.now() - startTime;
  parentPort.postMessage({ 
    output, 
    error: err.message, 
    executionTime 
  });
}
`;

function executeCodeInWorker(code: string, mode: "nodejs" | "browser"): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    // simplified for brevity in this rewrite, assuming worker logic is robust
    // In production, move workerCode to separate file
    const workerFile = join(TEMP_DIR, `worker_${Date.now()}_${Math.random().toString(36).slice(2)}.js`);

    try {
      writeFileSync(workerFile, workerCode);
      const worker = new Worker(workerFile, { workerData: { code, mode } });

      const timeout = setTimeout(() => {
        worker.terminate();
        resolve({ output: [], error: "Timeout", executionTime: EXECUTION_TIMEOUT });
      }, EXECUTION_TIMEOUT + 500);

      worker.on("message", (result) => {
        clearTimeout(timeout);
        try { unlinkSync(workerFile); } catch { }
        resolve(result);
      });

      worker.on("error", (err) => {
        clearTimeout(timeout);
        resolve({ output: [], error: err.message, executionTime: 0 });
      });
    } catch (err) {
      resolve({ output: [], error: "Worker Init Failed", executionTime: 0 });
    }
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/execute", async (req, res) => {
    try {
      const parseResult = executionRequestSchema.safeParse(req.body);
      if (!parseResult.success) return res.status(400).json({ error: "Invalid request" });
      const { code, mode } = parseResult.data;
      const result = await executeCodeInWorker(code, mode);
      return res.json({ success: !result.error, ...result });
    } catch (err) {
      return res.status(500).json({ error: "Execution failed" });
    }
  });

  app.get("/api/snippets", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const snippets = await storage.listSnippets(limit);
    return res.json(snippets);
  });

  app.get("/api/snippets/:id", async (req, res) => {
    const { id } = req.params;
    // Check if it looks like a shortId (8 chars) or MongoDB ObjectId (24 hex chars)
    // Actually our logic was: if <= 12 use shortId. ObjectIds are 24 chars.
    const snippet = id.length <= 12
      ? await storage.getSnippetByShortId(id)
      : await storage.getSnippetById(id);

    if (!snippet) return res.status(404).json({ error: "Snippet not found" });
    return res.json(snippet);
  });

  app.post("/api/snippets", async (req, res) => {
    const parseResult = insertSnippetSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ error: "Invalid input" });
    const snippet = await storage.createSnippet(parseResult.data);
    return res.status(201).json(snippet);
  });

  app.patch("/api/snippets/:id", async (req, res) => {
    const { id } = req.params;
    const snippet = await storage.updateSnippet(id, req.body);
    if (!snippet) return res.status(404).json({ error: "Snippet not found" });
    return res.json(snippet);
  });

  app.delete("/api/snippets/:id", async (req, res) => {
    const { id } = req.params;
    const deleted = await storage.deleteSnippet(id);
    if (!deleted) return res.status(404).json({ error: "Snippet not found" });
    return res.status(204).send();
  });

  app.get("/api/history", async (req, res) => {
    const snippetId = req.query.snippetId as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await storage.getExecutionHistory(snippetId, limit);
    return res.json(history);
  });

  app.post("/api/history", async (req, res) => {
    // Allow receiving history create requests
    const history = await storage.createExecutionHistory(req.body as any);
    return res.status(201).json(history);
  });

  return httpServer;
}
