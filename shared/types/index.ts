/**
 * Types compartilhados entre frontend e backend
 */

export type TranscriptionStatus = 
  | 'uploading'
  | 'transcribing'
  | 'correcting'
  | 'ready'
  | 'archived'
  | 'error';

export interface Transcription {
  id: number;
  userId: number;
  title: string;
  room: string | null;
  audioUrl: string;
  audioFilename: string;
  durationSeconds: number | null;
  rawText: string | null;
  correctedText: string | null;
  finalText: string | null;
  status: TranscriptionStatus;
  errorMessage: string | null;
  processingStartedAt: Date | null;
  processingCompletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Glossary {
  id: number;
  transcriptionId: number | null;
  name: string;
  info: string | null;
  isGlobal: boolean;
  createdAt: Date;
}

export interface SystemPrompt {
  id: number;
  version: number;
  content: string;
  isActive: boolean;
  createdBy: number;
  createdAt: Date;
}

// DTOs para criação
export interface CreateTranscriptionDto {
  title: string;
  room?: string;
  audio: File;
  glossary?: Array<{ name: string; info?: string }>;
}

export interface UpdateTranscriptionDto {
  title?: string;
  finalText?: string;
  status?: TranscriptionStatus;
}

export interface CreateGlossaryDto {
  name: string;
  info?: string;
  transcriptionId?: number;
  isGlobal?: boolean;
}

export interface CreateSystemPromptDto {
  content: string;
}
