import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { trpc } from '@/lib/trpc';
import { TranscriptionEditor } from '@/components/editor/TranscriptionEditor';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Spinner } from '@/components/common/Spinner';
import { usePollTranscription } from '@/hooks/usePollTranscription';

const STATUS_CONFIG = {
  uploading: { label: 'Enviando', color: 'bg-blue-100 text-blue-800' },
  transcribing: { label: 'Transcrevendo', color: 'bg-yellow-100 text-yellow-800' },
  correcting: { label: 'Corrigindo', color: 'bg-purple-100 text-purple-800' },
  ready: { label: 'Pronta', color: 'bg-green-100 text-green-800' },
  error: { label: 'Erro', color: 'bg-red-100 text-red-800' },
  archived: { label: 'Arquivada', color: 'bg-gray-100 text-gray-800' },
};

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const transcriptionId = Number(id);

  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);

  // @ts-ignore - Tipo temporário do tRPC
  const { data: transcription, isLoading, error, refetch } = trpc.transcriptions.getById.useQuery(
    { id: transcriptionId },
    { enabled: !isNaN(transcriptionId) }
  );

  // Polling para atualizações automáticas durante processamento
  usePollTranscription(transcriptionId, refetch, transcription?.status);

  // @ts-ignore - Tipo temporário do tRPC
  const updateMutation = trpc.transcriptions.update.useMutation({
    onSuccess: () => {
      toast.success('Metadados atualizados');
      setIsEditingMetadata(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar metadados');
    },
  });

  // Inicializar campos quando transcrição carregar
  useEffect(() => {
    if (transcription) {
      setTitle(transcription.title);
      setRoom(transcription.room || '');
    }
  }, [transcription]);

  const handleSaveMetadata = () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    updateMutation.mutate({
      id: transcriptionId,
      title: title.trim(),
      room: room.trim() || undefined,
    });
  };

  const handleCopyText = () => {
    if (!transcription?.transcriptionText) {
      toast.error('Nenhum texto para copiar');
      return;
    }

    // Remove HTML tags para copiar apenas texto
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = transcription.transcriptionText;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    navigator.clipboard.writeText(plainText)
      .then(() => {
        toast.success('Texto copiado para área de transferência');
      })
      .catch(() => {
        toast.error('Erro ao copiar texto');
      });
  };

  const handleExport = () => {
    if (!transcription?.transcriptionText) {
      toast.error('Nenhum texto para exportar');
      return;
    }

    // Remove HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = transcription.transcriptionText;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    // Criar arquivo .txt
    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${transcription.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Arquivo exportado');
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !transcription) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-red-600 text-lg">
          {error ? 'Erro ao carregar transcrição' : 'Transcrição não encontrada'}
        </div>
        <Button onClick={() => navigate('/')}>Voltar para início</Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[transcription.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ready;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - 30% */}
      <div className="w-[30%] bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Detalhes</h1>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate('/')}
            >
              ← Voltar
            </Button>
          </div>

          {/* Status Badge */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>

          {/* Metadata Form */}
          <div className="space-y-4 mb-6">
            <Input
              label="Título"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsEditingMetadata(true);
              }}
              placeholder="Nome da transcrição"
            />

            <Input
              label="Sala/Local"
              value={room}
              onChange={(e) => {
                setRoom(e.target.value);
                setIsEditingMetadata(true);
              }}
              placeholder="Ex: Plenário, Comissão..."
            />

            {isEditingMetadata && (
              <Button
                variant="primary"
                onClick={handleSaveMetadata}
                disabled={updateMutation.isPending}
                className="w-full"
              >
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Metadados'}
              </Button>
            )}
          </div>

          {/* Info Section */}
          <div className="space-y-3 border-t border-gray-200 pt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duração do Áudio</label>
              <p className="text-gray-900">{formatDuration(transcription.audioDuration)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
              <p className="text-gray-900">{formatDate(transcription.createdAt)}</p>
            </div>

            {transcription.processingStartedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Processamento Iniciado</label>
                <p className="text-gray-900">{formatDate(transcription.processingStartedAt)}</p>
              </div>
            )}

            {transcription.processingCompletedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Processamento Concluído</label>
                <p className="text-gray-900">{formatDate(transcription.processingCompletedAt)}</p>
              </div>
            )}

            {transcription.errorMessage && (
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">Mensagem de Erro</label>
                <p className="text-red-600 text-sm">{transcription.errorMessage}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2 border-t border-gray-200 pt-6 mt-6">
            <Button
              variant="secondary"
              onClick={handleCopyText}
              className="w-full"
              disabled={!transcription.transcriptionText || transcription.status !== 'ready'}
            >
              📋 Copiar Texto
            </Button>

            <Button
              variant="secondary"
              onClick={handleExport}
              className="w-full"
              disabled={!transcription.transcriptionText || transcription.status !== 'ready'}
            >
              💾 Exportar .txt
            </Button>

            {transcription.audioUrl && (
              <a
                href={transcription.audioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="secondary" className="w-full">
                  🎧 Ouvir Áudio
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Editor Area - 70% */}
      <div className="flex-1 flex flex-col">
        {transcription.status === 'ready' && transcription.transcriptionText ? (
          <TranscriptionEditor
            transcriptionId={transcriptionId}
            initialContent={transcription.transcriptionText}
            onSave={(content) => {
              // Callback opcional para quando salvar
              console.log('Texto salvo:', content.substring(0, 100) + '...');
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center max-w-md">
              {transcription.status === 'uploading' && (
                <>
                  <Spinner size="lg" />
                  <p className="mt-4 text-gray-600">Fazendo upload do áudio...</p>
                </>
              )}
              {transcription.status === 'transcribing' && (
                <>
                  <Spinner size="lg" />
                  <p className="mt-4 text-gray-600">Transcrevendo áudio com Whisper...</p>
                  <p className="mt-2 text-sm text-gray-500">Isso pode levar alguns minutos</p>
                </>
              )}
              {transcription.status === 'correcting' && (
                <>
                  <Spinner size="lg" />
                  <p className="mt-4 text-gray-600">Corrigindo e formatando texto com Claude...</p>
                  <p className="mt-2 text-sm text-gray-500">Quase lá!</p>
                </>
              )}
              {transcription.status === 'error' && (
                <>
                  <div className="text-red-600 text-6xl mb-4">⚠️</div>
                  <p className="text-gray-900 font-medium">Erro no processamento</p>
                  <p className="mt-2 text-sm text-gray-600">{transcription.errorMessage}</p>
                </>
              )}
              {transcription.status === 'archived' && (
                <>
                  <div className="text-gray-400 text-6xl mb-4">📦</div>
                  <p className="text-gray-900 font-medium">Transcrição arquivada</p>
                  <p className="mt-2 text-sm text-gray-600">Esta transcrição está arquivada e não pode ser editada</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
