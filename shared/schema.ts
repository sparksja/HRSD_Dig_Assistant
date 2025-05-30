import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const namingConventions = pgTable("naming_conventions", {
  id: serial("id").primaryKey(),
  department: text("department").notNull(),
  division: text("division"),
  section: text("section"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  azureId: text("azure_id").notNull().unique(),
  role: text("role").notNull().default("user"),
  lastLogin: timestamp("last_login"),
});

export const contexts = pgTable("contexts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sharePointUrl: text("sharepoint_url"),
  status: text("status").notNull().default("active"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  documentCount: integer("document_count").default(0),
  uploadedFiles: jsonb("uploaded_files").default([]), // Array of file metadata
});

export const contextFiles = pgTable("context_files", {
  id: serial("id").primaryKey(),
  contextId: integer("context_id").references(() => contexts.id).notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadPath: text("upload_path").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const queries = pgTable("queries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contextId: integer("context_id").references(() => contexts.id).notNull(),
  query: text("query").notNull(),
  response: text("response"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  isSaved: boolean("is_saved").notNull().default(false),
});

export const savedConversations = pgTable("saved_conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contextId: integer("context_id").references(() => contexts.id).notNull(),
  messages: jsonb("messages").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  lastLogin: true,
});

export const insertContextSchema = createInsertSchema(contexts).omit({
  id: true,
  lastUpdated: true,
});

export const insertQuerySchema = createInsertSchema(queries).omit({
  id: true,
  timestamp: true,
});

export const insertNamingConventionSchema = createInsertSchema(namingConventions).omit({
  id: true,
  createdAt: true,
});

export const insertSavedConversationSchema = createInsertSchema(savedConversations).omit({
  id: true,
  createdAt: true,
});

export const insertContextFileSchema = createInsertSchema(contextFiles).omit({
  id: true,
  uploadedAt: true,
});

// Export types
export type UserRole = 'superadmin' | 'admin' | 'user';

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Context = typeof contexts.$inferSelect;
export type InsertContext = z.infer<typeof insertContextSchema>;

export type Query = typeof queries.$inferSelect;
export type InsertQuery = z.infer<typeof insertQuerySchema>;

export type NamingConvention = typeof namingConventions.$inferSelect;
export type InsertNamingConvention = z.infer<typeof insertNamingConventionSchema>;

export type SavedConversation = typeof savedConversations.$inferSelect;
export type InsertSavedConversation = z.infer<typeof insertSavedConversationSchema>;

export type ContextFile = typeof contextFiles.$inferSelect;
export type InsertContextFile = z.infer<typeof insertContextFileSchema>;
