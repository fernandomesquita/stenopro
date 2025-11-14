import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AudioPlayerProps {
  audioUrl: string;
  onClose?: () => void;
}

export function AudioPlayer({ audioUrl, onClose }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);

  console.log('[AudioPlayer] 🎵 Inicializado com URL:', audioUrl);
  console.log('[AudioPlayer] 🌐 Origin:', window.location.origin);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('[AudioPlayer] 🔍 Verificando áudio...');
    console.log('[AudioPlayer] URL completa:', audioUrl);

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      console.log('[AudioPlayer] ✅ Duração:', audio.duration, 'segundos');
    };
    const handleEnded = () => {
      setIsPlaying(false);
      console.log('[AudioPlayer] ⏹️ Reprodução finalizada');
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const err = target.error;

      console.group('[AudioPlayer] ❌ ERRO');
      console.error('Error code:', err?.code);
      console.error('Error message:', err?.message);
      console.error('Network state:', audio.networkState);
      console.error('Ready state:', audio.readyState);
      console.error('URL:', audioUrl);
      console.groupEnd();

      let errorMessage = 'Erro ao carregar áudio';
      if (err?.code === 2) errorMessage = 'Erro de rede ao carregar áudio';
      if (err?.code === 3) errorMessage = 'Erro ao decodificar áudio';
      if (err?.code === 4) errorMessage = 'Formato de áudio não suportado';

      setError(errorMessage);
      toast.error(errorMessage);
    };

    const handleLoadedMetadata = () => {
      console.log('[AudioPlayer] ✅ Metadata carregada');
      console.log('[AudioPlayer] Duração total:', audio.duration, 'segundos');
    };

    const handleCanPlay = () => {
      console.log('[AudioPlayer] ✅ Pode reproduzir');
      console.log('[AudioPlayer] ReadyState:', audio.readyState);
      setError(null);
    };

    const handleLoadStart = () => {
      console.log('[AudioPlayer] 🔄 Iniciando carregamento...');
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const buffered = (audio.buffered.end(0) / audio.duration) * 100;
        console.log('[AudioPlayer] 📊 Buffered:', buffered.toFixed(1) + '%');
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('progress', handleProgress);

    // Forçar carregamento
    audio.load();

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('progress', handleProgress);
    };
  }, [audioUrl]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        console.log('[AudioPlayer] ⏸️ Pausado');
        setIsPlaying(false);
      } else {
        await audio.play();
        console.log('[AudioPlayer] ▶️ Reproduzindo');
        setIsPlaying(true);
      }
    } catch (err: any) {
      console.error('[AudioPlayer] ❌ Erro ao reproduzir:', err);
      toast.error('Erro ao reproduzir: ' + err.message);
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    console.log('[AudioPlayer] Seek para:', newTime);
  };

  const changePlaybackRate = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    setPlaybackRate(rate);
    console.log('[AudioPlayer] Velocidade alterada para:', rate + 'x');
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
    console.log('[AudioPlayer] ⏮️ Reiniciado');
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className='bg-white border-t shadow-lg p-4'>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload='metadata'
        crossOrigin='anonymous'
      />

      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <Volume2 className='w-5 h-5 text-gray-600' />
            <h3 className='font-semibold text-gray-900'>Player de Áudio</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600'
            >
              ✕
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4'>
            ⚠️ {error}
          </div>
        )}

        {/* Progress Bar */}
        <div className='mb-4'>
          <div className='flex items-center gap-3 mb-2'>
            <span className='text-sm text-gray-600 w-12 text-right'>
              {formatTime(currentTime)}
            </span>
            <div className='flex-1 relative'>
              <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-blue-600 transition-all'
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <input
                type='range'
                min='0'
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className='absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer'
              />
            </div>
            <span className='text-sm text-gray-600 w-12'>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className='flex items-center justify-between'>
          {/* Controles principais */}
          <div className='flex items-center gap-3'>
            <button
              onClick={restart}
              className='p-2 rounded-lg hover:bg-gray-100 transition-colors'
              title='Reiniciar'
            >
              <RotateCcw className='w-5 h-5 text-gray-600' />
            </button>

            <button
              onClick={togglePlay}
              className='p-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg'
            >
              {isPlaying ? (
                <Pause className='w-6 h-6' fill='currentColor' />
              ) : (
                <Play className='w-6 h-6' fill='currentColor' />
              )}
            </button>
          </div>

          {/* Velocidade */}
          <div className='flex items-center gap-2'>
            <span className='text-sm text-gray-600'>Velocidade:</span>
            <div className='flex gap-1'>
              {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                <button
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    playbackRate === rate
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div className='flex items-center gap-2'>
            <Volume2 className='w-4 h-4 text-gray-600' />
            <input
              type='range'
              min='0'
              max='1'
              step='0.1'
              value={volume}
              onChange={handleVolumeChange}
              className='w-24'
            />
            <span className='text-sm text-gray-600 w-8'>
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
