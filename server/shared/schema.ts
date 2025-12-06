import { pgTable, text, serial, timestamp, varchar, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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

export const snippets = pgTable("snippets", {
  id: serial("id").primaryKey(),
  shortId: varchar("short_id", { length: 12 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  code: text("code").notNull(),
  mode: varchar("mode", { length: 20 }).notNull().default("nodejs"),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSnippetSchema = createInsertSchema(snippets).omit({
  id: true,
  shortId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSnippet = z.infer<typeof insertSnippetSchema>;
export type Snippet = typeof snippets.$inferSelect;

export const executionHistory = pgTable("execution_history", {
  id: serial("id").primaryKey(),
  snippetId: integer("snippet_id").references(() => snippets.id),
  code: text("code").notNull(),
  mode: varchar("mode", { length: 20 }).notNull(),
  output: jsonb("output").notNull().$type<TerminalOutput[]>(),
  executionTime: integer("execution_time"),
  success: boolean("success").notNull(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExecutionHistorySchema = createInsertSchema(executionHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertExecutionHistory = z.infer<typeof insertExecutionHistorySchema>;
export type ExecutionHistory = typeof executionHistory.$inferSelect;

export interface SnippetFile {
  name: string;
  code: string;
  isEntryPoint: boolean;
}

export const snippetFiles = pgTable("snippet_files", {
  id: serial("id").primaryKey(),
  snippetId: integer("snippet_id").references(() => snippets.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  code: text("code").notNull(),
  isEntryPoint: boolean("is_entry_point").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSnippetFileSchema = createInsertSchema(snippetFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSnippetFile = z.infer<typeof insertSnippetFileSchema>;
export type SnippetFileRecord = typeof snippetFiles.$inferSelect;
