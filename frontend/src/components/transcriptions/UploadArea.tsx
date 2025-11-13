import React, { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Alert } from '../common/Alert';
import { trpc } from '../../lib/trpc';

interface UploadAreaProps {
  onUploadSuccess?: () => void;
}

export function UploadArea({ onUploadSuccess }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = trpc.transcriptions.create.useMutation({
    onSuccess: () => {
      // Resetar form
      setSelectedFile(null);
      setTitle('');
      setRoom('');
      setError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadSuccess?.();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  // Validar arquivo
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      return 'Formato não suportado. Use MP3, WAV ou OGG.';
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Tamanho máximo: 100MB';
    }

    return null;
  };

  // Handler de drag
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handler de seleção de arquivo
  const handleFileSelect = (file: File) => {
    setError('');

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);

    // Auto-preencher título com nome do arquivo (sem extensão)
    if (!title) {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTitle(fileNameWithoutExt);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handler de submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Selecione um arquivo de áudio');
      return;
    }

    if (!title.trim()) {
      setError('Digite um título para a transcrição');
      return;
    }

    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);

      reader.onload = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1]; // Remove "data:audio/...;base64,"

        await createMutation.mutateAsync({
          title: title.trim(),
          room: room.trim() || undefined,
          audioFile: {
            buffer: base64Data,
            filename: selectedFile.name,
            mimetype: selectedFile.type,
          },
        });
      };

      reader.onerror = () => {
        setError('Erro ao ler arquivo');
      };
    } catch (err) {
      // Erro já tratado no onError da mutation
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-6">Nova Transcrição</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Área de drag and drop */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
            }
            ${selectedFile ? 'bg-gray-50' : ''}
          `}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="flex items-center justify-center space-x-3">
              <File className="w-8 h-8 text-blue-600" />
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Arraste um arquivo de áudio aqui
              </p>
              <p className="text-sm text-gray-500 mb-4">
                ou clique para selecionar
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Selecionar Arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <p className="text-xs text-gray-400 mt-4">
                Formatos aceitos: MP3, WAV, OGG (máx. 100MB)
              </p>
            </>
          )}
        </div>

        {/* Campos do formulário */}
        <Input
          label="Título da Transcrição"
          placeholder="Ex: Sessão Ordinária 13/11/2025"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Input
          label="Sala/Local (opcional)"
          placeholder="Ex: Plenário Principal"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />

        {/* Erro */}
        {error && (
          <Alert variant="danger" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Botão de submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={createMutation.isPending}
          disabled={!selectedFile || !title.trim()}
          className="w-full"
        >
          {createMutation.isPending ? 'Enviando...' : 'Iniciar Transcrição'}
        </Button>

        {/* Info sobre processamento */}
        {createMutation.isPending && (
          <Alert variant="info">
            O áudio está sendo enviado. Após o upload, a transcrição será
            processada automaticamente.
          </Alert>
        )}
      </form>
    </div>
  );
}
