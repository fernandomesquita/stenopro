import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Extension } from '@tiptap/core';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { trpc } from '@/lib/trpc';
import { Button } from '../common/Button';

/**
 * Extensão customizada para converter texto selecionado em CAIXA ALTA
 * Usado para formatar nomes de parlamentares
 */
const CaixaAltaExtension = Extension.create({
  name: 'caixaAlta',

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-u': () => {
        const { state, view } = this.editor;
        const { from, to } = state.selection;
        const selectedText = state.doc.textBetween(from, to, '');

        if (selectedText) {
          const upperText = selectedText.toUpperCase();
          view.dispatch(state.tr.insertText(upperText, from, to));
          return true;
        }

        return false;
      },
    };
  },
});

interface TranscriptionEditorProps {
  transcriptionId: number;
  initialContent: string;
  onSave?: (content: string) => void;
}

export function TranscriptionEditor({
  transcriptionId,
  initialContent,
  onSave,
}: TranscriptionEditorProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // @ts-ignore - Tipo temporário do tRPC
  const updateMutation = trpc.transcriptions.update.useMutation({
    onSuccess: () => {
      setLastSaved(new Date());
      setIsSaving(false);
      setHasUnsavedChanges(false);
      toast.success('Salvo ✓', { duration: 2000 });
      onSave?.(editor?.getHTML() || '');
    },
    onError: (error: any) => {
      setIsSaving(false);
      toast.error(error.message || 'Erro ao salvar');
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        paragraph: {
          HTMLAttributes: {
            class: 'mb-4',
          },
        },
      }),
      CaixaAltaExtension,
    ],
    content: initialContent,
    onUpdate: () => {
      setHasUnsavedChanges(true);
    },
    editorProps: {
      attributes: {
        class: 'whitespace-pre-wrap min-h-[500px] focus:outline-none px-4 py-3',
      },
    },
  });

  // Autosave a cada 30 segundos
  const saveContent = useCallback(() => {
    if (!editor || !hasUnsavedChanges || isSaving) return;

    const content = editor.getHTML(); // HTML preserva formatação!

    console.log('[Editor] 💾 Salvando:', {
      id: transcriptionId,
      content: content.substring(0, 200),
      length: content.length,
    });

    setIsSaving(true);

    updateMutation.mutate({
      id: transcriptionId,
      finalText: content,
    });
  }, [editor, hasUnsavedChanges, isSaving, transcriptionId, updateMutation]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        saveContent();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [hasUnsavedChanges, saveContent]);

  // Salvar manualmente com Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveContent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveContent]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Carregando editor...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white p-2 flex items-center gap-2 sticky top-0 z-10">
        <Button
          size="sm"
          variant={editor.isActive('bold') ? 'primary' : 'secondary'}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrito (Ctrl+B)"
        >
          <strong>B</strong>
        </Button>

        <Button
          size="sm"
          variant={editor.isActive('italic') ? 'primary' : 'secondary'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Itálico (Ctrl+I)"
        >
          <em>I</em>
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          size="sm"
          variant="secondary"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Desfazer (Ctrl+Z)"
        >
          ↶
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Refazer (Ctrl+Shift+Z)"
        >
          ↷
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to, '');
            if (selectedText) {
              editor.commands.insertContentAt(
                { from, to },
                selectedText.toUpperCase()
              );
            } else {
              toast.error('Selecione um texto primeiro');
            }
          }}
          title="CAIXA ALTA (Ctrl+Shift+U)"
        >
          <span className="font-bold">AA</span>
        </Button>

        <div className="flex-1" />

        {/* Save Status */}
        <div className="flex items-center gap-2 text-sm">
          {isSaving && (
            <span className="text-blue-600 flex items-center gap-1">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            </span>
          )}

          {!isSaving && lastSaved && (
            <span className="text-green-600">
              Salvo ✓ {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          {!isSaving && hasUnsavedChanges && !lastSaved && (
            <span className="text-gray-500">Não salvo</span>
          )}

          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              if (!editor || !hasUnsavedChanges || isSaving) return;

              const content = editor.getHTML(); // HTML preserva formatação!

              console.log('[Editor] 💾 Salvando (manual):', {
                id: transcriptionId,
                content: content.substring(0, 200),
                length: content.length,
              });

              setIsSaving(true);

              toast.promise(
                updateMutation.mutateAsync({
                  id: transcriptionId,
                  finalText: content,
                }),
                {
                  loading: 'Salvando...',
                  success: 'Salvo com sucesso!',
                  error: 'Erro ao salvar'
                }
              );
            }}
            disabled={!hasUnsavedChanges || isSaving}
          >
            Salvar Agora
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>💡 Dica: Use <kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+Shift+U</kbd> para CAIXA ALTA</span>
          <span>|</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+S</kbd> para salvar</span>
          <span>|</span>
          <span>Autosave: 30s</span>
        </div>
      </div>
    </div>
  );
}
