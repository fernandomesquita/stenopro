import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

interface TranscriptionEditorProps {
  transcriptionId: number;
  initialText: string;
}

export function TranscriptionEditor({ transcriptionId, initialText }: TranscriptionEditorProps) {
  const [text, setText] = useState(initialText);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const lastContent = useRef(initialText);

  // @ts-ignore
  const updateMutation = trpc.transcriptions.update.useMutation({
    onSuccess: () => {
      setSaveStatus('saved');
      setLastSaved(new Date());
      toast.success('Salvo com sucesso!');
      console.log('✅ Texto salvo');
    },
    onError: (error: any) => {
      setSaveStatus('unsaved');
      toast.error('Erro ao salvar: ' + error.message);
      console.error('❌ Erro ao salvar:', error);
    }
  });

  // Log inicial
  useEffect(() => {
    console.log('=== CARREGANDO EDITOR ===');
    console.log('Text length:', initialText.length);
    console.log('Tem quebras de linha?', initialText.includes('\n'));
    console.log('Contagem de quebras:', (initialText.match(/\n/g) || []).length);
    console.log('Preview:', initialText.substring(0, 300));
  }, [initialText]);

  // Autosave a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (text !== lastContent.current && text.length > 0) {
        console.log('💾 Autosave disparado');
        setSaveStatus('saving');
        updateMutation.mutate({
          id: transcriptionId,
          finalText: text
        });
        lastContent.current = text;
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [text, transcriptionId, updateMutation]);

  const handleManualSave = () => {
    console.log('=== SAVE MANUAL ===');
    console.log('ID:', transcriptionId);
    console.log('Text length:', text.length);
    console.log('Tem quebras?', text.includes('\n'));
    console.log('Preview:', text.substring(0, 200));

    setSaveStatus('saving');
    updateMutation.mutate({
      id: transcriptionId,
      finalText: text
    });
    lastContent.current = text;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setSaveStatus('unsaved');
  };

  // Ctrl+S para salvar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text]);

  return (
    <div className="flex flex-col h-full">
      {/* Header com botão salvar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {saveStatus === 'saved' && (
            <span className="text-green-600">
              ✓ Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="text-blue-600">💾 Salvando...</span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="text-orange-600">● Não salvo</span>
          )}
          <span className="text-gray-400 ml-4">
            {text.length.toLocaleString()} caracteres
          </span>
        </div>

        <button
          onClick={handleManualSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          Salvar Agora
        </button>
      </div>

      {/* Textarea principal */}
      <textarea
        value={text}
        onChange={handleChange}
        className="flex-1 w-full p-6 font-sans text-base leading-relaxed resize-none focus:outline-none border-0"
        style={{
          whiteSpace: 'pre-wrap',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          lineHeight: '1.8',
        }}
        placeholder="O texto transcrito aparecerá aqui..."
        spellCheck={false}
      />

      {/* Footer com dicas */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>💡 Dica: Use <kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+S</kbd> para salvar</span>
          <span>|</span>
          <span>Autosave a cada 30 segundos</span>
        </div>
      </div>
    </div>
  );
}
