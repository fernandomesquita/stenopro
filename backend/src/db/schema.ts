import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean, longtext, json } from 'drizzle-orm/mysql-core';

// Tabela de usuários (futuro)
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['admin', 'analyst']).default('analyst'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Tabela principal de transcrições
export const transcriptions = mysqlTable('transcriptions', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().default(1), // Hardcoded para MVP
  title: varchar('title', { length: 255 }).notNull(),
  room: varchar('room', { length: 100 }),
  audioUrl: varchar('audio_url', { length: 512 }).notNull(),
  audioFilename: varchar('audio_filename', { length: 255 }).notNull(),
  durationSeconds: int('duration_seconds'),
  rawText: longtext('raw_text'),
  correctedText: longtext('corrected_text'),
  finalText: longtext('final_text'),
  status: mysqlEnum('status', [
    'uploading',
    'transcribing',
    'correcting',
    'ready',
    'archived',
    'error'
  ]).default('uploading'),
  errorMessage: text('error_message'),
  progressMessage: varchar('progress_message', { length: 255 }),
  progressPercent: int('progress_percent').default(0),
  processingStartedAt: timestamp('processing_started_at'),
  processingCompletedAt: timestamp('processing_completed_at'),
  customPrompt: text('custom_prompt'),
  glossaryTerms: json('glossary_terms'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Tabela de glossário
export const glossaries = mysqlTable('glossaries', {
  id: int('id').primaryKey().autoincrement(),
  transcriptionId: int('transcription_id'), // Null = global
  name: varchar('name', { length: 255 }).notNull(),
  info: varchar('info', { length: 255 }),
  isGlobal: boolean('is_global').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabela de prompts do sistema
export const systemPrompts = mysqlTable('system_prompts', {
  id: int('id').primaryKey().autoincrement(),
  version: int('version').notNull(),
  content: text('content').notNull(),
  isActive: boolean('is_active').default(false),
  createdBy: int('created_by').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabela de versões (opcional - implementar depois)
export const transcriptionVersions = mysqlTable('transcription_versions', {
  id: int('id').primaryKey().autoincrement(),
  transcriptionId: int('transcription_id').notNull(),
  version: int('version').notNull(),
  text: longtext('text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabela de documentos auxiliares
export const auxiliaryDocuments = mysqlTable('auxiliary_documents', {
  id: int('id').primaryKey().autoincrement(),
  transcriptionId: int('transcription_id').notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

// Tabela de templates de prompt
export const promptTemplates = mysqlTable('prompt_templates', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().default(1),
  name: varchar('name', { length: 255 }).notNull(),
  promptText: text('prompt_text').notNull(),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Types inferidos
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Transcription = typeof transcriptions.$inferSelect;
export type NewTranscription = typeof transcriptions.$inferInsert;

export type Glossary = typeof glossaries.$inferSelect;
export type NewGlossary = typeof glossaries.$inferInsert;

export type SystemPrompt = typeof systemPrompts.$inferSelect;
export type NewSystemPrompt = typeof systemPrompts.$inferInsert;

export type TranscriptionVersion = typeof transcriptionVersions.$inferSelect;
export type NewTranscriptionVersion = typeof transcriptionVersions.$inferInsert;

export type AuxiliaryDocument = typeof auxiliaryDocuments.$inferSelect;
export type NewAuxiliaryDocument = typeof auxiliaryDocuments.$inferInsert;

export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type NewPromptTemplate = typeof promptTemplates.$inferInsert;
