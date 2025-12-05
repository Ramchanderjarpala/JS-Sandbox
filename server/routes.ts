import type { Express } from "express";
import { createServer, type Server } from "http";
import { executionRequestSchema } from "@shared/schema";
import { Worker } from "worker_threads";
import { join } from "path";
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from "fs";

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
};

const browserGlobals = mode === 'browser' ? {
  window: new Proxy({}, {
    get: (target, prop) => {
      const mockWindow = {
        location: { href: 'http://localhost', pathname: '/', search: '', hash: '', origin: 'http://localhost', host: 'localhost', hostname: 'localhost', port: '', protocol: 'http:' },
        navigator: { userAgent: 'JSPlayground/1.0', language: 'en-US', languages: ['en-US'], platform: 'Web' },
        innerWidth: 1920,
        innerHeight: 1080,
        outerWidth: 1920,
        outerHeight: 1080,
        devicePixelRatio: 1,
        screen: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1080, colorDepth: 24, pixelDepth: 24 },
        history: { length: 1, pushState: () => {}, replaceState: () => {}, go: () => {}, back: () => {}, forward: () => {} },
        alert: (msg) => output.push({ type: 'log', content: '[alert] ' + String(msg) }),
        confirm: (msg) => { output.push({ type: 'log', content: '[confirm] ' + String(msg) }); return true; },
        prompt: (msg, def) => { output.push({ type: 'log', content: '[prompt] ' + String(msg) }); return def || ''; },
        getComputedStyle: () => ({}),
        matchMedia: () => ({ matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {} }),
        requestAnimationFrame: (cb) => { output.push({ type: 'info', content: '[requestAnimationFrame called]' }); return 0; },
        cancelAnimationFrame: () => {},
        performance: { now: () => Date.now() },
      };
      return mockWindow[prop];
    }
  }),
  document: new Proxy({}, {
    get: (target, prop) => {
      const mockDocument = {
        title: 'JSPlayground',
        body: { innerHTML: '', textContent: '', appendChild: () => {}, removeChild: () => {}, children: [], childNodes: [] },
        head: { appendChild: () => {}, children: [] },
        documentElement: { style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false } },
        querySelector: () => null,
        querySelectorAll: () => [],
        getElementById: () => null,
        getElementsByClassName: () => [],
        getElementsByTagName: () => [],
        createElement: (tag) => ({
          tagName: tag.toUpperCase(),
          innerHTML: '',
          textContent: '',
          style: {},
          classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
          setAttribute: () => {},
          getAttribute: () => null,
          addEventListener: () => {},
          removeEventListener: () => {},
          appendChild: () => {},
          removeChild: () => {},
          children: [],
          childNodes: [],
        }),
        createTextNode: (text) => ({ nodeType: 3, textContent: text }),
        createDocumentFragment: () => ({ appendChild: () => {}, children: [] }),
        cookie: '',
        readyState: 'complete',
        addEventListener: () => {},
        removeEventListener: () => {},
      };
      return mockDocument[prop];
    }
  }),
  localStorage: (() => {
    const store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = String(value); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
      get length() { return Object.keys(store).length; },
      key: (i) => Object.keys(store)[i] || null,
    };
  })(),
  sessionStorage: (() => {
    const store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = String(value); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
      get length() { return Object.keys(store).length; },
      key: (i) => Object.keys(store)[i] || null,
    };
  })(),
  fetch: () => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Map(),
  }),
  XMLHttpRequest: function() {
    return {
      open: () => {},
      send: () => {},
      setRequestHeader: () => {},
      readyState: 4,
      status: 200,
      responseText: '',
    };
  },
  atob: (str) => Buffer.from(str, 'base64').toString('binary'),
  btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
  URL: URL,
  URLSearchParams: URLSearchParams,
  TextEncoder: TextEncoder,
  TextDecoder: TextDecoder,
} : {};

const nodeGlobals = mode === 'nodejs' ? {
  require: (module) => {
    output.push({ type: 'info', content: '[require called for: ' + module + '] - Module loading not available in sandbox' });
    return {};
  },
  module: { exports: {} },
  exports: {},
  __dirname: '/sandbox',
  __filename: '/sandbox/script.js',
} : {};

const timerStore = { id: 0, timers: new Map() };

const sandbox = {
  console: customConsole,
  JSON: JSON,
  Math: Math,
  Date: Date,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean,
  RegExp: RegExp,
  Error: Error,
  TypeError: TypeError,
  ReferenceError: ReferenceError,
  SyntaxError: SyntaxError,
  RangeError: RangeError,
  URIError: URIError,
  EvalError: EvalError,
  Map: Map,
  Set: Set,
  WeakMap: WeakMap,
  WeakSet: WeakSet,
  Promise: Promise,
  Symbol: Symbol,
  Proxy: Proxy,
  Reflect: Reflect,
  Intl: Intl,
  BigInt: BigInt,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  isFinite: isFinite,
  encodeURI: encodeURI,
  decodeURI: decodeURI,
  encodeURIComponent: encodeURIComponent,
  decodeURIComponent: decodeURIComponent,
  escape: escape,
  unescape: unescape,
  NaN: NaN,
  Infinity: Infinity,
  undefined: undefined,
  setTimeout: (fn, delay = 0) => {
    const id = ++timerStore.id;
    output.push({ type: 'info', content: '[setTimeout registered with ' + delay + 'ms delay]' });
    return id;
  },
  setInterval: (fn, delay = 0) => {
    const id = ++timerStore.id;
    output.push({ type: 'info', content: '[setInterval registered with ' + delay + 'ms interval]' });
    return id;
  },
  clearTimeout: () => {},
  clearInterval: () => {},
  queueMicrotask: (fn) => {
    output.push({ type: 'info', content: '[queueMicrotask called]' });
  },
  ...browserGlobals,
  ...nodeGlobals,
};

try {
  const context = vm.createContext(sandbox, {
    name: 'JSPlayground Sandbox',
    codeGeneration: {
      strings: false,
      wasm: false,
    },
  });

  const script = new vm.Script(code, {
    filename: 'playground.js',
  });

  const result = script.runInContext(context, {
    timeout: 5000,
    displayErrors: true,
    breakOnSigint: true,
  });

  if (result !== undefined) {
    output.push({ type: 'result', content: formatValue(result) });
  }

  const executionTime = Date.now() - startTime;
  parentPort.postMessage({ output, executionTime });
} catch (err) {
  const executionTime = Date.now() - startTime;
  let errorMessage = err.message || String(err);
  let stack = '';
  
  if (err.stack) {
    const lines = err.stack.split('\\n').slice(1, 3);
    stack = lines
      .map(line => line.trim())
      .filter(line => !line.includes('vm.js') && !line.includes('node:vm') && !line.includes('worker_threads'))
      .join('\\n');
  }
  
  parentPort.postMessage({ 
    output, 
    error: stack ? errorMessage + '\\n' + stack : errorMessage, 
    executionTime 
  });
}
`;

function executeCodeInWorker(code: string, mode: "nodejs" | "browser"): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const workerFile = join(TEMP_DIR, `worker_${Date.now()}_${Math.random().toString(36).slice(2)}.js`);
    
    try {
      writeFileSync(workerFile, workerCode);
      
      const worker = new Worker(workerFile, {
        workerData: { code, mode },
        resourceLimits: {
          maxOldGenerationSizeMb: 64,
          maxYoungGenerationSizeMb: 32,
          codeRangeSizeMb: 16,
          stackSizeMb: 4,
        },
      });

      const timeout = setTimeout(() => {
        worker.terminate();
        try { unlinkSync(workerFile); } catch {}
        resolve({
          output: [],
          error: "Execution timed out (5 second limit exceeded)",
          executionTime: EXECUTION_TIMEOUT,
        });
      }, EXECUTION_TIMEOUT + 500);

      worker.on("message", (result: ExecutionResult) => {
        clearTimeout(timeout);
        try { unlinkSync(workerFile); } catch {}
        resolve(result);
      });

      worker.on("error", (err) => {
        clearTimeout(timeout);
        try { unlinkSync(workerFile); } catch {}
        resolve({
          output: [],
          error: err.message || "Worker execution error",
          executionTime: 0,
        });
      });

      worker.on("exit", (exitCode) => {
        if (exitCode !== 0) {
          clearTimeout(timeout);
          try { unlinkSync(workerFile); } catch {}
        }
      });
    } catch (err) {
      try { unlinkSync(workerFile); } catch {}
      resolve({
        output: [],
        error: err instanceof Error ? err.message : "Failed to create worker",
        executionTime: 0,
      });
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
      
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid request: " + parseResult.error.errors.map(e => e.message).join(", "),
          output: [],
          executionTime: 0,
        });
      }

      const { code, mode } = parseResult.data;
      
      if (code.length > 100000) {
        return res.status(400).json({
          success: false,
          error: "Code exceeds maximum length (100KB)",
          output: [],
          executionTime: 0,
        });
      }

      const result = await executeCodeInWorker(code, mode);

      return res.json({
        success: !result.error,
        ...result,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown execution error";
      return res.status(500).json({
        success: false,
        error: errorMessage,
        output: [],
        executionTime: 0,
      });
    }
  });

  return httpServer;
}
