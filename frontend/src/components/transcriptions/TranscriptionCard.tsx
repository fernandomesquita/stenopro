import {
  Upload,
  Mic,
  Edit,
  Check,
  AlertCircle,
  RefreshCw,
  Trash2,
  FileText,
} from 'lucide-react';
import { Button } from '../common/Button';

interface Transcription {
  id: number;
  title: string;
  room: string | null;
  status: 'uploading' | 'transcribing' | 'correcting' | 'ready' | 'archived' | 'error';
  errorMessage: string | null;
  durationSeconds: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface TranscriptionCardProps {
  transcription: Transcription;
  onEdit?: (id: number) => void;
  onReprocess?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const STATUS_CONFIG = {
  uploading: {
    label: 'Enviando',
    icon: Upload,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  transcribing: {
    label: 'Transcrevendo',
    icon: Mic,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  correcting: {
    label: 'Corrigindo',
    icon: Edit,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  },
  ready: {
    label: 'Pronto',
    icon: Check,
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  archived: {
    label: 'Arquivado',
    icon: FileText,
    color: 'text-gray-600 bg-gray-50 border-gray-200',
  },
  error: {
    label: 'Erro',
    icon: AlertCircle,
    color: 'text-red-600 bg-red-50 border-red-200',
  },
};

export function TranscriptionCard({
  transcription,
  onEdit,
  onReprocess,
  onDelete,
}: TranscriptionCardProps) {
  const config = STATUS_CONFIG[transcription.status];
  const Icon = config.icon;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isProcessing = ['uploading', 'transcribing', 'correcting'].includes(
    transcription.status
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
      {/* Header com status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {transcription.title}
          </h3>
          {transcription.room && (
            <p className="text-sm text-gray-500 mb-2">{transcription.room}</p>
          )}
        </div>

        {/* Status badge */}
        <span
          className={`
            inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
            ${config.color}
          `}
        >
          <Icon className="w-4 h-4 mr-1.5" />
          {config.label}
        </span>
      </div>

      {/* Informações */}
      <div className="flex items-center text-sm text-gray-600 space-x-4 mb-4">
        <span>Criado: {formatDate(transcription.createdAt)}</span>
        {transcription.durationSeconds && (
          <span>Duração: {formatDuration(transcription.durationSeconds)}</span>
        )}
      </div>

      {/* Mensagem de erro */}
      {transcription.status === 'error' && transcription.errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{transcription.errorMessage}</p>
        </div>
      )}

      {/* Barra de progresso para processamento */}
      {isProcessing && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">Processando...</p>
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center space-x-2">
        {transcription.status === 'ready' && onEdit && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onEdit(transcription.id)}
          >
            <Edit className="w-4 h-4 mr-1.5" />
            Editar
          </Button>
        )}

        {transcription.status === 'error' && onReprocess && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onReprocess(transcription.id)}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Reprocessar
          </Button>
        )}

        {onDelete && !isProcessing && (
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              if (
                window.confirm(
                  `Tem certeza que deseja excluir "${transcription.title}"?`
                )
              ) {
                onDelete(transcription.id);
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Excluir
          </Button>
        )}
      </div>
    </div>
  );
}
