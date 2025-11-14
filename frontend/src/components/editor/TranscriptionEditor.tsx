import React, { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

interface TranscriptionEditorProps {
  transcriptionId: number;
  initialText: string;
}

export function TranscriptionEditor({ transcriptionId, initialText }: TranscriptionEditorProps) {
  // State local NUNCA deve ser sobrescrito por props
  const [text, setText] = useState(initialText);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const lastContent = useRef(initialText);
  const isInitialized = useRef(false);

  // Inicializar apenas UMA VEZ
  useEffect(() => {
    if (!isInitialized.current && initialText) {
      setText(initialText);
      lastContent.current = initialText;
      isInitialized.current = true;
      console.log('[Editor] Inicializado com texto:', initialText.length, 'chars');
    }
  }, []);

  // @ts-ignore
  // Mutation SEM invalidateQueries
  const updateMutation = trpc.transcriptions.update.useMutation({
    onSuccess: (data: any) => {
      console.log('[Editor] ✅ Save success:', data);

      // Atualizar referência
      lastContent.current = text;

      // Atualizar UI
      setSaveStatus('saved');
      setLastSaved(new Date());
      toast.success('Salvo com sucesso!');

      // NÃO invalidar cache global
      // NÃO refetch
      // Deixar o texto como está!
    },
    onError: (error: any) => {
      console.error('[Editor] ❌ Save error:', error);
      setSaveStatus('unsaved');
      toast.error('Erro ao salvar: ' + error.message);
    }
  });

  // Autosave a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (text !== lastContent.current && text.length > 0) {
        console.log('[Editor] 💾 Autosave disparado');
        setSaveStatus('saving');
        updateMutation.mutate({
          id: transcriptionId,
          finalText: text
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [text, transcriptionId]);

  const handleManualSave = () => {
    console.group('[Editor] === SAVE MANUAL ===');
    console.log('ID:', transcriptionId);
    console.log('Text length:', text.length);
    console.log('Preview:', text.substring(0, 200));
    console.groupEnd();

    setSaveStatus('saving');
    updateMutation.mutate({
      id: transcriptionId,
      finalText: text
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
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
      {/* Header */}
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Salvar Agora
        </button>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={handleChange}
        className="flex-1 w-full p-6 font-sans text-base leading-relaxed resize-none focus:outline-none"
        style={{
          whiteSpace: 'pre-wrap',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          lineHeight: '1.8'
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
