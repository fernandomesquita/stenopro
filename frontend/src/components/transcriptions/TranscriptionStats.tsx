import { Clock, FileText, Users, Target, TrendingUp } from 'lucide-react';

interface Stats {
  raw: { words: number; characters: number };
  corrected: { words: number; characters: number };
  final: { words: number; characters: number };
  deputiesCount: number;
  glossaryTermsCount: number;
  processingTime: number | null;
}

interface TranscriptionStatsProps {
  stats: Stats;
  duration?: string;
}

export function TranscriptionStats({ stats }: TranscriptionStatsProps) {
  const charDiff = stats.corrected.characters - stats.raw.characters;

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '--';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className='mt-3 pt-3 border-t border-gray-200'>
      <div className='text-xs font-medium text-gray-500 mb-2'>
        📊 ESTATÍSTICAS
      </div>

      <div className='grid grid-cols-2 gap-2 text-xs'>
        {/* Linha 1 */}
        <div className='flex items-center gap-2 text-gray-600'>
          <Clock className='w-3.5 h-3.5' />
          <span className='font-medium'>Processamento:</span>
          <span className='text-gray-900'>{formatTime(stats.processingTime)}</span>
        </div>

        <div className='flex items-center gap-2 text-gray-600'>
          <FileText className='w-3.5 h-3.5' />
          <span className='font-medium'>Palavras:</span>
          <span className='text-gray-900'>{stats.corrected.words}</span>
        </div>

        {/* Linha 2 */}
        <div className='flex items-center gap-2 text-gray-600'>
          <Users className='w-3.5 h-3.5' />
          <span className='font-medium'>Deputados:</span>
          <span className='text-gray-900'>{stats.deputiesCount}</span>
        </div>

        <div className='flex items-center gap-2 text-gray-600'>
          <Target className='w-3.5 h-3.5' />
          <span className='font-medium'>Glossário:</span>
          <span className='text-gray-900'>{stats.glossaryTermsCount} termos</span>
        </div>

        {/* Linha 3 - Caracteres */}
        <div className='col-span-2 flex items-center gap-2 text-gray-600'>
          <TrendingUp className='w-3.5 h-3.5' />
          <span className='font-medium'>Caracteres:</span>
          <span className='text-gray-900'>
            {stats.raw.characters.toLocaleString()} → {stats.corrected.characters.toLocaleString()}
          </span>
          <span className={`font-medium ${charDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ({charDiff >= 0 ? '+' : ''}{charDiff.toLocaleString()})
          </span>
        </div>
      </div>
    </div>
  );
}
