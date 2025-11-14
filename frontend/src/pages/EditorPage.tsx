import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { TabbedTextViewer } from '../components/editor/TabbedTextViewer';
import { AudioPlayer } from '../components/audio/AudioPlayer';

export function EditorPage() {
  const { id } = useParams();
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  // @ts-ignore - Tipo temporário do tRPC
  const { data: transcription, isLoading } = trpc.transcriptions.getById.useQuery(
    { id: parseInt(id!) },
    { enabled: !!id }
  );

  console.log('[EditorPage] Carregando transcrição:', id);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Carregando transcrição...</p>
        </div>
      </div>
    );
  }

  if (!transcription) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <p className='text-gray-600 mb-4'>Transcrição não encontrada</p>
          <Link to='/' className='text-blue-600 hover:underline'>
            Voltar para início
          </Link>
        </div>
      </div>
    );
  }

  console.log('[EditorPage] Transcrição carregada:', {
    id: transcription.id,
    status: transcription.status,
    hasRaw: !!transcription.rawText,
    hasCorrected: !!transcription.correctedText,
    hasFinal: !!transcription.finalText
  });

  const audioUrl = transcription.audioUrl?.startsWith('http')
    ? transcription.audioUrl
    : window.location.origin + transcription.audioUrl;

  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white border-b shadow-sm'>
        <div className='px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Link
                to='/'
                className='flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors'
              >
                <ArrowLeft className='w-5 h-5' />
                Voltar
              </Link>
              <div className='border-l pl-4'>
                <h1 className='text-xl font-semibold text-gray-900'>
                  {transcription.title}
                </h1>
                <p className='text-sm text-gray-600'>
                  {transcription.room} • {transcription.status}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                console.log('[EditorPage]', showAudioPlayer ? 'Fechando' : 'Abrindo', 'player');
                setShowAudioPlayer(!showAudioPlayer);
              }}
              className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              <Volume2 className='w-4 h-4' />
              {showAudioPlayer ? 'Fechar Áudio' : 'Ouvir Áudio'}
            </button>
          </div>
        </div>

        {/* Audio Player */}
        {showAudioPlayer && (
          <AudioPlayer
            audioUrl={audioUrl}
            onClose={() => setShowAudioPlayer(false)}
          />
        )}
      </header>

      {/* Content */}
      <main className='flex-1 overflow-hidden'>
        <TabbedTextViewer
          transcriptionId={transcription.id}
          rawText={transcription.rawText || ''}
          correctedText={transcription.correctedText || ''}
          finalText={transcription.finalText || ''}
        />
      </main>
    </div>
  );
}
