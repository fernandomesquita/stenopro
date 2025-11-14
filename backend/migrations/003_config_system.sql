-- Migration 003: Sistema de Configuração
-- Adiciona tabelas para documentos auxiliares e templates de prompt
-- Adiciona campos customPrompt e glossaryTerms em transcriptions

-- 1. Adicionar campos em transcriptions
ALTER TABLE transcriptions
ADD COLUMN custom_prompt TEXT AFTER processing_completed_at,
ADD COLUMN glossary_terms JSON AFTER custom_prompt;

-- 2. Criar tabela de documentos auxiliares
CREATE TABLE IF NOT EXISTS auxiliary_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transcription_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_transcription_id (transcription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Criar tabela de templates de prompt
CREATE TABLE IF NOT EXISTS prompt_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  prompt_text TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Inserir template padrão
INSERT INTO prompt_templates (name, prompt_text, is_default) VALUES (
  'Padrão Parlamentar',
  'Você é um especialista em transcrições parlamentares brasileiras.\n\nFormate o texto seguindo os padrões:\n- Oradores: O SR. NOME (PARTIDO-UF):\n- Manifestações: (Palmas.), (Risos.)\n- Parágrafos a cada mudança de assunto\n- Correção gramatical mantendo fidelidade ao discurso',
  TRUE
);
