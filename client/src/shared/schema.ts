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

export interface SnippetFile {
  name: string;
  code: string;
  isEntryPoint: boolean;
}