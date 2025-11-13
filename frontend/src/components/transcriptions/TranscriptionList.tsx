import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { TranscriptionCard } from './TranscriptionCard';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import { Alert } from '../common/Alert';
import { trpc } from '../../lib/trpc';

interface TranscriptionListProps {
  onEdit?: (id: number) => void;
}

export function TranscriptionList({ onEdit }: TranscriptionListProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roomFilter, setRoomFilter] = useState('');

  const limit = 10;

  // Query para listar transcrições
  // @ts-ignore - Tipo temporário do tRPC
  const { data, isLoading, error, refetch } = trpc.transcriptions.list.useQuery({
    page,
    limit,
    search: search || undefined,
    status: statusFilter || undefined,
    room: roomFilter || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Mutation para reprocessar
  // @ts-ignore - Tipo temporário do tRPC
  const reprocessMutation = trpc.transcriptions.reprocess.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Mutation para deletar (placeholder - precisa ser implementado no backend)
  const handleDelete = async (id: number) => {
    // TODO: Implementar endpoint de delete no backend
    console.log('Delete transcription:', id);
    alert('Funcionalidade de deletar será implementada em breve');
  };

  const handleReprocess = async (id: number) => {
    try {
      await reprocessMutation.mutateAsync(id);
    } catch (err) {
      alert('Erro ao reprocessar transcrição');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <h3 className="font-medium mb-1">Erro ao carregar transcrições</h3>
        <p>{error.message}</p>
        <Button onClick={() => refetch()} className="mt-3" size="sm">
          Tentar Novamente
        </Button>
      </Alert>
    );
  }

  const { items, pagination } = data || { items: [], pagination: null };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset para primeira página
              }}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="uploading">Enviando</option>
            <option value="transcribing">Transcrevendo</option>
            <option value="correcting">Corrigindo</option>
            <option value="ready">Pronto</option>
            <option value="archived">Arquivado</option>
            <option value="error">Erro</option>
          </select>

          {/* Filtro por sala */}
          <Input
            placeholder="Filtrar por sala..."
            value={roomFilter}
            onChange={(e) => {
              setRoomFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Limpar filtros */}
        {(search || statusFilter || roomFilter) && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setRoomFilter('');
              setPage(1);
            }}
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Lista de transcrições */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Transcrições
            {pagination && (
              <span className="text-gray-500 font-normal ml-2">
                ({pagination.total} {pagination.total === 1 ? 'item' : 'itens'})
              </span>
            )}
          </h2>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Atualizar
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">
              {search || statusFilter || roomFilter
                ? 'Nenhuma transcrição encontrada com os filtros aplicados'
                : 'Nenhuma transcrição ainda. Faça upload do primeiro áudio!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((transcription: any) => (
              <TranscriptionCard
                key={transcription.id}
                transcription={transcription}
                onEdit={onEdit}
                onReprocess={handleReprocess}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">
            Página {pagination.page} de {pagination.totalPages}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={!pagination.hasPrev || isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={!pagination.hasNext || isLoading}
            >
              Próxima
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
