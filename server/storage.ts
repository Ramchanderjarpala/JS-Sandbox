import {
  type Snippet,
  type InsertSnippet,
  type ExecutionHistory,
  type InsertExecutionHistory,
  type SnippetFileRecord,
  type InsertSnippetFile
} from "@shared/schema";
import mongoose, { Schema, Document } from "mongoose";
import { nanoid } from "nanoid";

// Mongoose Schemas
const snippetSchema = new Schema({
  shortId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  code: { type: String, required: true },
  mode: { type: String, required: true, default: "nodejs" },
  description: { type: String },
  isPublic: { type: Boolean, required: true, default: true },
}, { timestamps: true });

// Convert _id to id
snippetSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

const executionHistorySchema = new Schema({
  snippetId: { type: Schema.Types.ObjectId, ref: 'Snippet' },
  code: { type: String, required: true },
  mode: { type: String, required: true },
  output: { type: Schema.Types.Mixed, required: true }, // Store JSONB content
  executionTime: { type: Number },
  success: { type: Boolean, required: true },
  error: { type: String },
}, { timestamps: true });

executionHistorySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

const snippetFileSchema = new Schema({
  snippetId: { type: Schema.Types.ObjectId, ref: 'Snippet', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  isEntryPoint: { type: Boolean, required: true, default: false },
}, { timestamps: true });

snippetFileSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

// Models
const SnippetModel = mongoose.model('Snippet', snippetSchema);
const ExecutionHistoryModel = mongoose.model('ExecutionHistory', executionHistorySchema);
const SnippetFileModel = mongoose.model('SnippetFile', snippetFileSchema);

export interface IStorage {
  createSnippet(snippet: InsertSnippet): Promise<Snippet>;
  getSnippetById(id: string): Promise<Snippet | undefined>;
  getSnippetByShortId(shortId: string): Promise<Snippet | undefined>;
  updateSnippet(id: string, snippet: Partial<InsertSnippet>): Promise<Snippet | undefined>;
  deleteSnippet(id: string): Promise<boolean>;
  listSnippets(limit?: number): Promise<Snippet[]>;

  createExecutionHistory(history: InsertExecutionHistory): Promise<ExecutionHistory>;
  getExecutionHistory(snippetId?: string, limit?: number): Promise<ExecutionHistory[]>;

  createSnippetFile(file: InsertSnippetFile): Promise<SnippetFileRecord>;
  getSnippetFiles(snippetId: string): Promise<SnippetFileRecord[]>;
  updateSnippetFile(id: string, file: Partial<InsertSnippetFile>): Promise<SnippetFileRecord | undefined>;
  deleteSnippetFile(id: string): Promise<boolean>;
}

export class MongoStorage implements IStorage {
  async createSnippet(snippet: InsertSnippet): Promise<Snippet> {
    const shortId = nanoid(8);
    const created = await SnippetModel.create({ ...snippet, shortId });
    return created.toJSON() as Snippet;
  }

  async getSnippetById(id: string): Promise<Snippet | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const snippet = await SnippetModel.findById(id);
    return snippet ? (snippet.toJSON() as Snippet) : undefined;
  }

  async getSnippetByShortId(shortId: string): Promise<Snippet | undefined> {
    const snippet = await SnippetModel.findOne({ shortId });
    return snippet ? (snippet.toJSON() as Snippet) : undefined;
  }

  async updateSnippet(id: string, snippet: Partial<InsertSnippet>): Promise<Snippet | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const updated = await SnippetModel.findByIdAndUpdate(
      id,
      { ...snippet },
      { new: true }
    );
    return updated ? (updated.toJSON() as Snippet) : undefined;
  }

  async deleteSnippet(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await SnippetModel.findByIdAndDelete(id);
    return !!result;
  }

  async listSnippets(limit = 50): Promise<Snippet[]> {
    const snippets = await SnippetModel.find().sort({ updatedAt: -1 }).limit(limit);
    return snippets.map(s => s.toJSON() as Snippet);
  }

  async createExecutionHistory(history: InsertExecutionHistory): Promise<ExecutionHistory> {
    const created = await ExecutionHistoryModel.create(history);
    return created.toJSON() as ExecutionHistory;
  }

  async getExecutionHistory(snippetId?: string, limit = 20): Promise<ExecutionHistory[]> {
    const query = snippetId ? { snippetId } : {};
    const history = await ExecutionHistoryModel.find(query).sort({ createdAt: -1 }).limit(limit);
    return history.map(h => h.toJSON() as ExecutionHistory);
  }

  async createSnippetFile(file: InsertSnippetFile): Promise<SnippetFileRecord> {
    const created = await SnippetFileModel.create(file);
    return created.toJSON() as SnippetFileRecord;
  }

  async getSnippetFiles(snippetId: string): Promise<SnippetFileRecord[]> {
    const files = await SnippetFileModel.find({ snippetId });
    return files.map(f => f.toJSON() as SnippetFileRecord);
  }

  async updateSnippetFile(id: string, file: Partial<InsertSnippetFile>): Promise<SnippetFileRecord | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const updated = await SnippetFileModel.findByIdAndUpdate(
      id,
      { ...file },
      { new: true }
    );
    return updated ? (updated.toJSON() as SnippetFileRecord) : undefined;
  }

  async deleteSnippetFile(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await SnippetFileModel.findByIdAndDelete(id);
    return !!result;
  }
}

export const storage = new MongoStorage();
