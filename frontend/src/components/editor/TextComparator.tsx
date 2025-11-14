import { useState, useMemo } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { FileText, Download, ArrowLeftRight } from 'lucide-react';
import { TextNormalizer } from '../../utils/textNormalizer';

type ComparisonMode = 'raw-corrected' | 'corrected-final' | 'raw-final';
type ViewMode = 'split' | 'unified';

interface TextComparatorProps {
  rawText: string;
  correctedText: string;
  finalText: string;
  transcriptionId: number;
  title: string;
}

export function TextComparator({
  rawText,
  correctedText,
  finalText,
  transcriptionId,
  title
}: TextComparatorProps) {
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('raw-corrected');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [showDiffOnly, setShowDiffOnly] = useState(false);

  console.log('[TextComparator] Modo:', comparisonMode, 'View:', viewMode);

  // Normalizar textos ANTES de comparar
  const { oldText, newText, oldTitle, newTitle } = useMemo(() => {
    console.group('[TextComparator] Normalizando textos');

    let oldRaw = '';
    let newRaw = '';
    let oldLabel = '';
    let newLabel = '';

    switch (comparisonMode) {
      case 'raw-corrected':
        oldRaw = rawText || '';
        newRaw = correctedText || '';
        oldLabel = '📄 Raw (Whisper)';
        newLabel = '🤖 Corrigido (Claude)';
        break;
      case 'corrected-final':
        oldRaw = correctedText || '';
        newRaw = finalText || correctedText || '';
        oldLabel = '🤖 Corrigido (Claude)';
        newLabel = '✏️ Final (Editado)';
        break;
      case 'raw-final':
        oldRaw = rawText || '';
        newRaw = finalText || correctedText || '';
        oldLabel = '📄 Raw (Whisper)';
        newLabel = '✏️ Final';
        break;
    }

    // NORMALIZAR: remover HTML, manter apenas texto
    const normalizedOld = TextNormalizer.normalizeForComparison(oldRaw);
    const normalizedNew = TextNormalizer.normalizeForComparison(newRaw);

    console.log('Old (original):', oldRaw.substring(0, 100));
    console.log('Old (normalized):', normalizedOld.substring(0, 100));
    console.log('New (original):', newRaw.substring(0, 100));
    console.log('New (normalized):', normalizedNew.substring(0, 100));
    console.groupEnd();

    return {
      oldText: normalizedOld,
      newText: normalizedNew,
      oldTitle: oldLabel,
      newTitle: newLabel
    };
  }, [comparisonMode, rawText, correctedText, finalText]);

  // Calcular estatísticas com textos normalizados
  const stats = useMemo(() => {
    if (!oldText || !newText) return null;

    const oldWords = oldText.split(/\s+/).filter(w => w.length > 0);
    const newWords = newText.split(/\s+/).filter(w => w.length > 0);

    const additions = newText.length - oldText.length;
    const additionsPercent = oldText.length > 0
      ? Math.round((additions / oldText.length) * 100)
      : 0;

    const wordDiff = newWords.length - oldWords.length;

    // Calcular similaridade
    const similarity = TextNormalizer.areEqual(oldText, newText)
      ? 100
      : Math.round((1 - (Math.abs(additions) / Math.max(oldText.length, newText.length))) * 100);

    console.log('[TextComparator] Stats:', {
      oldChars: oldText.length,
      newChars: newText.length,
      additions,
      similarity
    });

    return {
      oldChars: oldText.length,
      newChars: newText.length,
      additions,
      additionsPercent,
      oldWords: oldWords.length,
      newWords: newWords.length,
      wordDiff,
      similarity
    };
  }, [oldText, newText]);

  const handleExport = () => {
    const content = `
COMPARAÇÃO DE TEXTOS - ${title}
Modo: ${comparisonMode}
Data: ${new Date().toLocaleString('pt-BR')}

═══════════════════════════════════════════════════════════
${oldTitle.toUpperCase()}
═══════════════════════════════════════════════════════════

${oldText}

═══════════════════════════════════════════════════════════
${newTitle.toUpperCase()}
═══════════════════════════════════════════════════════════

${newText}

═══════════════════════════════════════════════════════════
ESTATÍSTICAS
═══════════════════════════════════════════════════════════

Caracteres: ${stats?.oldChars} → ${stats?.newChars} (${stats?.additions && stats.additions >= 0 ? '+' : ''}${stats?.additions})
Palavras: ${stats?.oldWords} → ${stats?.newWords} (${stats?.wordDiff && stats.wordDiff >= 0 ? '+' : ''}${stats?.wordDiff})
Variação: ${stats?.additionsPercent}%
`.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparacao_${transcriptionId}_${comparisonMode}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('[TextComparator] 💾 Comparação exportada');
  };

  return (
    <div className='flex flex-col h-full bg-white'>
      {/* Controles */}
      <div className='border-b bg-gray-50 p-4'>
        <div className='flex items-center justify-between gap-4 mb-3'>
          {/* Modo de comparação */}
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium text-gray-700'>Comparar:</span>
            <select
              value={comparisonMode}
              onChange={(e) => {
                console.log('[TextComparator] Trocando modo:', e.target.value);
                setComparisonMode(e.target.value as ComparisonMode);
              }}
              className='px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='raw-corrected'>
                📄 Raw vs 🤖 Claude
              </option>
              <option value='corrected-final'>
                🤖 Claude vs ✏️ Final
              </option>
              <option value='raw-final'>
                📄 Raw vs ✏️ Final
              </option>
            </select>
          </div>

          {/* View mode */}
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-2 text-sm rounded transition-colors ${
                viewMode === 'split'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ArrowLeftRight className='w-4 h-4 inline mr-1' />
              Lado-a-Lado
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`px-3 py-2 text-sm rounded transition-colors ${
                viewMode === 'unified'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className='w-4 h-4 inline mr-1' />
              Unificado
            </button>
          </div>

          {/* Opções */}
          <div className='flex items-center gap-2'>
            <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
              <input
                type='checkbox'
                checked={showDiffOnly}
                onChange={(e) => setShowDiffOnly(e.target.checked)}
                className='rounded'
              />
              Apenas diferenças
            </label>

            <button
              onClick={handleExport}
              className='flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm'
            >
              <Download className='w-4 h-4' />
              Exportar
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
            <div className='text-xs font-medium text-blue-800 mb-2'>
              📊 RESUMO DA COMPARAÇÃO
            </div>
            <div className='grid grid-cols-5 gap-4 text-xs'>
              <div>
                <div className='text-gray-600'>Caracteres</div>
                <div className='font-semibold text-gray-900'>
                  {stats.oldChars.toLocaleString()} → {stats.newChars.toLocaleString()}
                  <span className={`ml-1 ${stats.additions >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({stats.additions >= 0 ? '+' : ''}{stats.additions.toLocaleString()})
                  </span>
                </div>
              </div>

              <div>
                <div className='text-gray-600'>Palavras</div>
                <div className='font-semibold text-gray-900'>
                  {stats.oldWords.toLocaleString()} → {stats.newWords.toLocaleString()}
                  <span className={`ml-1 ${stats.wordDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({stats.wordDiff >= 0 ? '+' : ''}{stats.wordDiff})
                  </span>
                </div>
              </div>

              <div>
                <div className='text-gray-600'>Variação</div>
                <div className='font-semibold text-gray-900'>
                  <span className={`${stats.additionsPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.additionsPercent >= 0 ? '+' : ''}{stats.additionsPercent}%
                  </span>
                </div>
              </div>

              <div>
                <div className='text-gray-600'>Similaridade</div>
                <div className='font-semibold text-gray-900'>
                  <span className={`${
                    stats.similarity >= 80 ? 'text-green-600' :
                    stats.similarity >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {stats.similarity}%
                  </span>
                </div>
              </div>

              <div>
                <div className='text-gray-600'>Tamanho Final</div>
                <div className='font-semibold text-gray-900'>
                  {(stats.newChars / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Diff Viewer */}
      <div className='flex-1 overflow-auto'>
        <ReactDiffViewer
          oldValue={oldText}
          newValue={newText}
          splitView={viewMode === 'split'}
          leftTitle={oldTitle}
          rightTitle={newTitle}
          showDiffOnly={showDiffOnly}
          compareMethod={DiffMethod.WORDS}
          styles={{
            variables: {
              light: {
                diffViewerBackground: '#fff',
                diffViewerColor: '#212529',
                addedBackground: '#e6ffed',
                addedColor: '#24292e',
                removedBackground: '#ffeef0',
                removedColor: '#24292e',
                wordAddedBackground: '#acf2bd',
                wordRemovedBackground: '#fdb8c0',
                addedGutterBackground: '#cdffd8',
                removedGutterBackground: '#ffdce0',
                gutterBackground: '#f7f7f7',
                gutterBackgroundDark: '#f3f1f1',
                highlightBackground: '#fffbdd',
                highlightGutterBackground: '#fff5b1',
              },
            },
            line: {
              padding: '10px 2px',
              fontSize: '14px',
              lineHeight: '1.6',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            },
            gutter: {
              padding: '0 10px',
              minWidth: '50px',
            },
          }}
        />
      </div>
    </div>
  );
}
