import { 
  snippets, 
  executionHistory,
  snippetFiles,
  type Snippet, 
  type InsertSnippet,
  type ExecutionHistory,
  type InsertExecutionHistory,
  type SnippetFileRecord,
  type InsertSnippetFile
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  createSnippet(snippet: InsertSnippet): Promise<Snippet>;
  getSnippetById(id: number): Promise<Snippet | undefined>;
  getSnippetByShortId(shortId: string): Promise<Snippet | undefined>;
  updateSnippet(id: number, snippet: Partial<InsertSnippet>): Promise<Snippet | undefined>;
  deleteSnippet(id: number): Promise<boolean>;
  listSnippets(limit?: number): Promise<Snippet[]>;
  
  createExecutionHistory(history: InsertExecutionHistory): Promise<ExecutionHistory>;
  getExecutionHistory(snippetId?: number, limit?: number): Promise<ExecutionHistory[]>;
  
  createSnippetFile(file: InsertSnippetFile): Promise<SnippetFileRecord>;
  getSnippetFiles(snippetId: number): Promise<SnippetFileRecord[]>;
  updateSnippetFile(id: number, file: Partial<InsertSnippetFile>): Promise<SnippetFileRecord | undefined>;
  deleteSnippetFile(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async createSnippet(snippet: InsertSnippet): Promise<Snippet> {
    const shortId = nanoid(8);
    const [created] = await db
      .insert(snippets)
      .values({ ...snippet, shortId })
      .returning();
    return created;
  }

  async getSnippetById(id: number): Promise<Snippet | undefined> {
    const [snippet] = await db.select().from(snippets).where(eq(snippets.id, id));
    return snippet || undefined;
  }

  async getSnippetByShortId(shortId: string): Promise<Snippet | undefined> {
    const [snippet] = await db.select().from(snippets).where(eq(snippets.shortId, shortId));
    return snippet || undefined;
  }

  async updateSnippet(id: number, snippet: Partial<InsertSnippet>): Promise<Snippet | undefined> {
    const [updated] = await db
      .update(snippets)
      .set({ ...snippet, updatedAt: new Date() })
      .where(eq(snippets.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSnippet(id: number): Promise<boolean> {
    const result = await db.delete(snippets).where(eq(snippets.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async listSnippets(limit = 50): Promise<Snippet[]> {
    return db.select().from(snippets).orderBy(desc(snippets.updatedAt)).limit(limit);
  }

  async createExecutionHistory(history: InsertExecutionHistory): Promise<ExecutionHistory> {
    const [created] = await db
      .insert(executionHistory)
      .values(history)
      .returning();
    return created;
  }

  async getExecutionHistory(snippetId?: number, limit = 20): Promise<ExecutionHistory[]> {
    if (snippetId) {
      return db
        .select()
        .from(executionHistory)
        .where(eq(executionHistory.snippetId, snippetId))
        .orderBy(desc(executionHistory.createdAt))
        .limit(limit);
    }
    return db
      .select()
      .from(executionHistory)
      .orderBy(desc(executionHistory.createdAt))
      .limit(limit);
  }

  async createSnippetFile(file: InsertSnippetFile): Promise<SnippetFileRecord> {
    const [created] = await db
      .insert(snippetFiles)
      .values(file)
      .returning();
    return created;
  }

  async getSnippetFiles(snippetId: number): Promise<SnippetFileRecord[]> {
    return db.select().from(snippetFiles).where(eq(snippetFiles.snippetId, snippetId));
  }

  async updateSnippetFile(id: number, file: Partial<InsertSnippetFile>): Promise<SnippetFileRecord | undefined> {
    const [updated] = await db
      .update(snippetFiles)
      .set({ ...file, updatedAt: new Date() })
      .where(eq(snippetFiles.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSnippetFile(id: number): Promise<boolean> {
    const result = await db.delete(snippetFiles).where(eq(snippetFiles.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
