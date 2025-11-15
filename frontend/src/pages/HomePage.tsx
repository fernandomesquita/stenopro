import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '../lib/trpc';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Tooltip } from '../components/ui/Tooltip';
import {
  Mic, Upload, Search, Edit, Trash2, FileText,
  Clock, Users, Target, Settings
} from 'lucide-react';

export function HomePage() {
  // @ts-ignore - Tipo temporário do tRPC
  const { data: transcriptions, isLoading, refetch, error, status, fetchStatus } = trpc.transcriptions.list.useQuery();

  // DEBUG: Log query state changes
  console.log('[HomePage] 🔍 Query State:', {
    status,
    fetchStatus,
    isLoading,
    hasData: !!transcriptions,
    hasError: !!error,
    dataType: typeof transcriptions,
    isArray: Array.isArray(transcriptions),
  });

  if (error) {
    console.error('[HomePage] ❌ Query Error:', error);
  }

  if (transcriptions) {
    console.log('[HomePage] ✅ Query Data:', {
      type: typeof transcriptions,
      isArray: Array.isArray(transcriptions),
      keys: Object.keys(transcriptions),
      value: transcriptions,
    });
  }
  // @ts-ignore - Tipo temporário do tRPC
  const deleteMutation = trpc.transcriptions.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('✅ Transcrição excluída!');
    },
    onError: (error: any) => {
      toast.error('❌ Erro ao excluir: ' + error.message);
    }
  });

  const [searchQuery, setSearchQuery] = useState('');

  // DEBUG: Track query state changes over time
  useEffect(() => {
    console.group('[HomePage] 🔄 useEffect - Query State Changed');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Status:', status);
    console.log('Fetch Status:', fetchStatus);
    console.log('Is Loading:', isLoading);
    console.log('Has Error:', !!error);
    console.log('Has Data:', !!transcriptions);

    if (transcriptions) {
      console.log('Data structure:', {
        type: typeof transcriptions,
        isArray: Array.isArray(transcriptions),
        hasItems: 'items' in transcriptions,
        hasPagination: 'pagination' in transcriptions,
        keys: Object.keys(transcriptions),
      });

      // Check if it's paginated response
      if ('items' in transcriptions) {
        console.log('Paginated response detected');
        console.log('Items count:', (transcriptions as any).items?.length);
        console.log('Items:', (transcriptions as any).items);
      } else {
        console.log('Direct array response');
        console.log('Length:', Array.isArray(transcriptions) ? transcriptions.length : 'N/A');
      }
    }

    if (error) {
      console.error('Error details:', {
        message: (error as any)?.message,
        data: (error as any)?.data,
        shape: (error as any)?.shape,
      });
    }

    console.groupEnd();
  }, [status, fetchStatus, transcriptions, error, isLoading]);

  // Extract items from paginated response
  const items = (transcriptions as any)?.items || [];

  const filteredTranscriptions = items.filter((t: any) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta transcrição?')) {
      deleteMutation.mutate({ id });
    }
  };

  // Debug logs
  console.log('[HomePage] Render', {
    isLoading,
    hasTranscriptions: !!transcriptions,
    hasItems: !!items,
    itemsCount: items?.length,
    searchQuery,
    filteredCount: filteredTranscriptions?.length
  });

  // Log detalhado das transcrições
  if (items && items.length > 0) {
    console.log('[HomePage] Items:', items.map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      hasStats: !!t.stats
    })));
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'>
        <LoadingSpinner size='lg' text='Carregando transcrições...' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'>
      {/* Header com gradiente */}
      <header className='bg-gradient-primary text-white shadow-elevated'>
        <div className='max-w-7xl mx-auto px-6 py-8'>
          <div className='flex items-center justify-between'>
            <div className='animate-fade-in-up'>
              <h1 className='text-4xl font-bold mb-2 flex items-center gap-3'>
                <Mic className='w-10 h-10' />
                StenoPro
              </h1>
              <p className='text-blue-100 text-lg'>
                Sistema Inteligente de Transcrição
              </p>
            </div>

            <div className='flex gap-3 animate-fade-in-up' style={{ animationDelay: '0.1s' }}>
              <Link
                to='/upload'
                className='flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg
                         font-semibold hover:shadow-hover transform hover:scale-105
                         transition-all duration-200'
              >
                <Upload className='w-5 h-5' />
                Novo Upload
              </Link>

              <Link
                to='/settings'
                className='flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-lg
                         border border-white/20 text-white rounded-lg font-semibold
                         hover:bg-white/20 transition-all duration-200'
              >
                <Settings className='w-5 h-5' />
                Configurações
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className='max-w-7xl mx-auto px-6 py-8'>
        {/* Barra de busca */}
        <div className='mb-8 animate-fade-in-up' style={{ animationDelay: '0.2s' }}>
          <div className='relative max-w-2xl'>
            <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='🔍 Buscar transcrições...'
              className='w-full pl-12 pr-4 py-4 bg-white rounded-xl border-0 shadow-soft
                       focus:ring-2 focus:ring-purple-500 focus:shadow-hover
                       transition-all duration-200 text-lg'
            />
          </div>
        </div>

        {/* Lista de transcrições */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between mb-4 animate-fade-in-up' style={{ animationDelay: '0.3s' }}>
            <h2 className='text-2xl font-bold text-gray-900'>
              Transcrições
              {filteredTranscriptions && (
                <span className='ml-2 text-gray-500'>
                  ({filteredTranscriptions.length} {filteredTranscriptions.length === 1 ? 'item' : 'itens'})
                </span>
              )}
            </h2>

            <button
              onClick={() => refetch()}
              className='flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900
                       hover:bg-white rounded-lg transition-all duration-200'
            >
              🔄 Atualizar
            </button>
          </div>

          {(!items || items.length === 0) ? (
            <EmptyState
              icon={Mic}
              title='Nenhuma transcrição ainda'
              description='Faça upload de um áudio para começar a transcrever!'
              action={{
                label: '📤 Fazer Primeiro Upload',
                onClick: () => window.location.href = '/upload'
              }}
            />
          ) : !filteredTranscriptions || filteredTranscriptions.length === 0 ? (
            <EmptyState
              icon={Search}
              title='Nenhuma transcrição encontrada'
              description='Tente buscar com outros termos'
            />
          ) : (
            filteredTranscriptions.map((transcription: any, index: number) => (
              <div
                key={transcription.id}
                className='animate-fade-in-up'
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <Card
                  hover
                  className='p-6'
                >
                {/* Header do card */}
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h3 className='text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2'>
                      <Mic className='w-5 h-5 text-purple-600' />
                      {transcription.title}
                    </h3>

                    <div className='flex items-center gap-4 text-sm text-gray-600'>
                      <Tooltip content='Data de criação'>
                        <span className='flex items-center gap-1'>
                          <Clock className='w-4 h-4' />
                          {new Date(transcription.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </Tooltip>

                      {transcription.duration && (
                        <Tooltip content='Duração do áudio'>
                          <span>⏱️ {transcription.duration}</span>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant={
                      transcription.status === 'ready' ? 'success' :
                      transcription.status === 'processing' ? 'warning' :
                      'error'
                    }
                    animate={transcription.status === 'processing'}
                    size='lg'
                  >
                    {transcription.status === 'ready' ? '✅ Pronto' :
                     transcription.status === 'processing' ? '⏳ Processando' :
                     '❌ Erro'}
                  </Badge>
                </div>

                {/* Estatísticas */}
                {transcription.stats && (
                  <div className='grid grid-cols-4 gap-4 mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg'>
                    <Tooltip content='Palavras na transcrição'>
                      <div className='text-center'>
                        <FileText className='w-5 h-5 mx-auto mb-1 text-blue-600' />
                        <div className='text-2xl font-bold text-gray-900'>
                          {transcription.stats.final.words}
                        </div>
                        <div className='text-xs text-gray-600'>palavras</div>
                      </div>
                    </Tooltip>

                    <Tooltip content='Deputados mencionados'>
                      <div className='text-center'>
                        <Users className='w-5 h-5 mx-auto mb-1 text-purple-600' />
                        <div className='text-2xl font-bold text-gray-900'>
                          {transcription.stats.deputiesCount}
                        </div>
                        <div className='text-xs text-gray-600'>deputados</div>
                      </div>
                    </Tooltip>

                    <Tooltip content='Termos do glossário aplicados'>
                      <div className='text-center'>
                        <Target className='w-5 h-5 mx-auto mb-1 text-green-600' />
                        <div className='text-2xl font-bold text-gray-900'>
                          {transcription.stats.glossaryTermsCount}
                        </div>
                        <div className='text-xs text-gray-600'>termos</div>
                      </div>
                    </Tooltip>

                    <Tooltip content='Tempo de processamento'>
                      <div className='text-center'>
                        <Clock className='w-5 h-5 mx-auto mb-1 text-orange-600' />
                        <div className='text-2xl font-bold text-gray-900'>
                          {transcription.stats.processingTime || '--'}s
                        </div>
                        <div className='text-xs text-gray-600'>processo</div>
                      </div>
                    </Tooltip>
                  </div>
                )}

                {/* Actions */}
                <div className='flex gap-2'>
                  <Link
                    to={`/editor/${transcription.id}`}
                    className='flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white
                             rounded-lg font-medium hover:shadow-hover transform hover:scale-105
                             transition-all duration-200'
                  >
                    <Edit className='w-4 h-4' />
                    Editar
                  </Link>

                  <button
                    onClick={() => handleDelete(transcription.id)}
                    disabled={deleteMutation.isPending}
                    className='flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600
                             rounded-lg font-medium hover:bg-red-100 hover:shadow-soft
                             transition-all duration-200 disabled:opacity-50'
                  >
                    <Trash2 className='w-4 h-4' />
                    {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
                </Card>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default HomePage;
