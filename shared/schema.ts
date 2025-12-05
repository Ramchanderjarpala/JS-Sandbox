import { z } from "zod";

export type ExecutionMode = "nodejs" | "browser";

export interface ExecutionRequest {
  code: string;
  mode: ExecutionMode;
}

export interface ExecutionResult {
  success: boolean;
  output: string[];
  error?: string;
  executionTime?: number;
}

export interface TerminalOutput {
  type: "log" | "error" | "warn" | "info" | "result" | "system";
  content: string;
  timestamp: number;
}

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: "on" | "off";
  minimap: boolean;
  lineNumbers: "on" | "off";
  theme: "vs-dark" | "light";
  autoRun: boolean;
}

export const executionRequestSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  mode: z.enum(["nodejs", "browser"]),
});

export type InsertExecutionRequest = z.infer<typeof executionRequestSchema>;

export const defaultEditorSettings: EditorSettings = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: "on",
  minimap: true,
  lineNumbers: "on",
  theme: "vs-dark",
  autoRun: false,
};

export const defaultCode = `// Welcome to JSPlayground!
// Write your JavaScript code here and click Run or press Ctrl+Enter

// Example: Simple function
function greet(name) {
  return \`Hello, \${name}! Welcome to the JavaScript playground.\`;
}

console.log(greet("Developer"));

// Try some array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled:", doubled);

// Object example
const user = {
  name: "John",
  age: 25,
  skills: ["JavaScript", "TypeScript", "React"]
};

console.log("User info:", user);
`;

export const insertSnippetSchema = z.object({
  title: z.string().min(1, "Title is required"),
  code: z.string(),
  mode: z.string().default("nodejs"),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export type InsertSnippet = z.infer<typeof insertSnippetSchema>;

export interface Snippet extends InsertSnippet {
  id: string;
  shortId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertExecutionHistorySchema = z.object({
  snippetId: z.string().optional(), // Changed to string for ObjectId
  code: z.string(),
  mode: z.string(),
  output: z.any(), // Keeping loose for now, can be TerminalOutput[]
  executionTime: z.number().optional(),
  success: z.boolean(),
  error: z.string().optional(),
});

export type InsertExecutionHistory = z.infer<typeof insertExecutionHistorySchema>;

export interface ExecutionHistory extends InsertExecutionHistory {
  id: string;
  createdAt: Date;
}

export interface SnippetFile {
  name: string;
  code: string;
  isEntryPoint: boolean;
}

export const insertSnippetFileSchema = z.object({
  snippetId: z.string(),
  name: z.string(),
  code: z.string(),
  isEntryPoint: z.boolean().default(false),
});

export type InsertSnippetFile = z.infer<typeof insertSnippetFileSchema>;

export interface SnippetFileRecord extends InsertSnippetFile {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
