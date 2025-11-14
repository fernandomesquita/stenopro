import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, File, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { trpc } from '../../lib/trpc';

interface UploadAreaProps {
  onUploadSuccess?: () => void;
}

export function UploadArea({ onUploadSuccess }: UploadAreaProps) {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // @ts-ignore
  // Buscar prompts disponíveis
  const { data: prompts = [] } = trpc.promptTemplates.list.useQuery();

  // @ts-ignore
  // Buscar prompt padrão
  const { data: defaultPrompt } = trpc.promptTemplates.getDefault.useQuery();

  // Definir padrão quando carregar
  useEffect(() => {
    if (defaultPrompt && !selectedPromptId) {
      setSelectedPromptId(defaultPrompt.id);
      console.log('[Upload] Prompt padrão selecionado:', defaultPrompt.name);
    }
  }, [defaultPrompt, selectedPromptId]);

  // @ts-ignore - Tipo temporário do tRPC
  const createMutation = trpc.transcriptions.create.useMutation({
    onSuccess: () => {
      console.log('[UploadArea] ✅ Upload concluído com sucesso, invalidando cache...');

      toast.success('Upload iniciado! A transcrição será processada automaticamente.', {
        duration: 4000,
      });

      // Invalidar todas as queries de transcrições para forçar reload
      queryClient.invalidateQueries({
        predicate: (query) => {
          // Invalida qualquer query que contenha 'transcriptions' na key
          return query.queryKey.some((key) =>
            typeof key === 'string' && key.includes('transcriptions')
          );
        },
      });

      console.log('[UploadArea] 🔄 Cache invalidado, lista será atualizada');

      // Resetar form
      setSelectedFile(null);
      setTitle('');
      setRoom('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao fazer upload do áudio');
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
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSelectedFile(file);
    toast.success(`Arquivo "${file.name}" selecionado`);

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
      toast.error('Selecione um arquivo de áudio');
      return;
    }

    if (!title.trim()) {
      toast.error('Digite um título para a transcrição');
      return;
    }

    console.group('[Upload] === INICIANDO UPLOAD ===');
    console.log('[Upload] Arquivo:', selectedFile.name);
    console.log('[Upload] Título:', title);
    console.log('[Upload] Prompt selecionado ID:', selectedPromptId);

    // Buscar texto do prompt selecionado
    const selectedPrompt = prompts.find((p: any) => p.id === selectedPromptId);
    if (selectedPrompt) {
      console.log('[Upload] Prompt nome:', selectedPrompt.name);
      console.log('[Upload] Prompt texto length:', selectedPrompt.promptText?.length);
      console.log('[Upload] Prompt preview:', selectedPrompt.promptText?.substring(0, 200));
    } else {
      console.log('[Upload] ⚠️ Nenhum prompt selecionado');
    }
    console.groupEnd();

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
          customPromptId: selectedPromptId || undefined,
        });
      };

      reader.onerror = () => {
        toast.error('Erro ao ler arquivo');
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

        {/* NOVO: Dropdown de prompts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Padrão de Revisão
          </label>
          <select
            value={selectedPromptId || ''}
            onChange={(e) => {
              const id = parseInt(e.target.value);
              setSelectedPromptId(id);
              const prompt = prompts.find((p: any) => p.id === id);
              console.log('[Upload] Prompt alterado para:', prompt?.name);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          >
            {prompts.length === 0 ? (
              <option value="">Nenhum prompt disponível</option>
            ) : (
              prompts.map((prompt: any) => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.name} {prompt.isDefault ? '(Padrão)' : ''}
                </option>
              ))
            )}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Escolha o padrão de correção que o Claude usará na transcrição
          </p>
        </div>

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
      </form>
    </div>
  );
}
