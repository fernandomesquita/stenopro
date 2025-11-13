-- Migration: Add progress tracking fields to transcriptions table
-- Date: 2025-11-13

ALTER TABLE transcriptions
ADD COLUMN progress_message VARCHAR(255) AFTER error_message,
ADD COLUMN progress_percent INT DEFAULT 0 AFTER progress_message;

-- Update existing records to have default progress values
UPDATE transcriptions
SET progress_message = CASE
  WHEN status = 'uploading' THEN 'Enviando áudio...'
  WHEN status = 'transcribing' THEN 'Transcrevendo áudio com Whisper...'
  WHEN status = 'correcting' THEN 'Corrigindo texto com Claude...'
  WHEN status = 'ready' THEN 'Concluído!'
  WHEN status = 'archived' THEN 'Arquivado'
  WHEN status = 'error' THEN 'Erro no processamento'
  ELSE NULL
END,
progress_percent = CASE
  WHEN status = 'uploading' THEN 0
  WHEN status = 'transcribing' THEN 33
  WHEN status = 'correcting' THEN 66
  WHEN status = 'ready' THEN 100
  WHEN status = 'archived' THEN 100
  WHEN status = 'error' THEN 0
  ELSE 0
END
WHERE progress_message IS NULL;
