import { useState, useEffect } from 'react';
import { FileText, Sparkles, Edit3, Copy, Download, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { trpc } from '../../lib/trpc';
import { RichTextEditor } from './RichTextEditor';
import { useQueryClient } from '@tanstack/react-query';

type TabType = 'raw' | 'corrected' | 'final';

interface TabbedTextViewerProps {
  transcriptionId: number;
  rawText: string;
  correctedText: string;
  finalText: string;
}

export function TabbedTextViewer({
  transcriptionId,
  rawText,
  correctedText,
  finalText
}: TabbedTextViewerProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('corrected');
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(finalText || correctedText || '');
  const [savedFinalText, setSavedFinalText] = useState(finalText || correctedText || '');

  console.log('[TabbedViewer] Render:', {
    activeTab,
    isEditing,
    editedTextLength: editedText.length,
    savedFinalTextLength: savedFinalText.length
  });

  // Sincronizar estado local quando props mudarem (ex: reload da página)
  useEffect(() => {
    console.log('[TabbedViewer] 🔄 Props mudaram, sincronizando estado local...');
    console.log('[TabbedViewer] finalText do props:', finalText?.substring(0, 100));
    console.log('[TabbedViewer] finalText length:', finalText?.length || 0);

    if (finalText) {
      console.log('[TabbedViewer] ✅ Atualizando savedFinalText com finalText');
      setSavedFinalText(finalText);
    } else if (correctedText) {
      console.log('[TabbedViewer] ⚠️ Usando correctedText como fallback');
      setSavedFinalText(correctedText);
    }
  }, [finalText, correctedText]);

  // @ts-ignore - Tipo temporário do tRPC
  const updateMutation = trpc.transcriptions.update.useMutation({
    onMutate: async (newData: any) => {
      console.group('[Mutation] onMutate - Iniciando atualização otimista');
      console.log('Novo finalText length:', newData.finalText?.length || 0);
      console.log('Novo finalText preview:', newData.finalText?.substring(0, 200));

      // Cancelar queries em andamento para este ID
      await queryClient.cancelQueries({
        queryKey: [['transcriptions', 'getById'], { input: { id: transcriptionId } }]
      });

      // Snapshot do estado anterior do cache
      const previousData = queryClient.getQueryData([
        ['transcriptions', 'getById'],
        { input: { id: transcriptionId } }
      ]);

      console.log('[Mutation] Previous cache data:', previousData);

      // Atualizar cache otimisticamente
      queryClient.setQueryData(
        [['transcriptions', 'getById'], { input: { id: transcriptionId } }],
        (old: any) => {
          console.log('[Mutation] Atualizando cache otimisticamente');
          console.log('[Mutation] Old finalText:', old?.finalText?.substring(0, 100));
          return {
            ...old,
            finalText: newData.finalText,
            updatedAt: new Date()
          };
        }
      );

      console.groupEnd();

      // Retornar contexto para rollback se necessário
      return { previousData };
    },

    onSuccess: (data: any) => {
      console.group('[Mutation] ✅ Sucesso!');
      console.log('Data retornada:', data);
      console.log('finalText salvo length:', data?.finalText?.length || 0);

      // Atualizar estado local
      setSavedFinalText(editedText);

      // Invalidar para refetch e garantir sincronização com servidor
      queryClient.invalidateQueries({
        queryKey: [['transcriptions', 'getById'], { input: { id: transcriptionId } }]
      });

      toast.success('Texto salvo com sucesso!');
      setIsEditing(false);
      console.groupEnd();
    },

    onError: (error: any, _variables: any, context: any) => {
      console.group('[Mutation] ❌ Erro ao salvar');
      console.error('Error:', error);
      console.error('Error message:', error.message);

      // Reverter cache para estado anterior
      if (context?.previousData) {
        console.log('[Mutation] Revertendo cache para estado anterior');
        queryClient.setQueryData(
          [['transcriptions', 'getById'], { input: { id: transcriptionId } }],
          context.previousData
        );
      }

      toast.error('Erro ao salvar: ' + error.message);
      console.groupEnd();
    }
  });

  const tabs = [
    {
      id: 'raw' as TabType,
      label: 'Raw (Whisper)',
      icon: FileText,
      content: rawText || 'Nenhum texto bruto disponível',
      description: 'Transcrição direta do áudio'
    },
    {
      id: 'corrected' as TabType,
      label: 'Corrigido (Claude)',
      icon: Sparkles,
      content: correctedText || 'Nenhum texto corrigido disponível',
      description: 'Texto processado pelo Claude'
    },
    {
      id: 'final' as TabType,
      label: 'Final',
      icon: Edit3,
      content: savedFinalText, // Usar estado local
      description: 'Versão editável final'
    }
  ];

  const currentTab = tabs.find(t => t.id === activeTab)!;
  const currentText = isEditing ? editedText : currentTab.content;

  const handleStartEdit = () => {
    console.log('[TabbedViewer] Iniciando edição');
    console.log('[TabbedViewer] Texto inicial:', savedFinalText.substring(0, 200));
    setEditedText(savedFinalText);
    setIsEditing(true);
  };

  const handleSave = () => {
    console.group('[TabbedViewer] === SALVANDO ===');
    console.log('ID:', transcriptionId);
    console.log('Text length:', editedText.length);
    console.log('Preview:', editedText.substring(0, 200));
    console.groupEnd();

    updateMutation.mutate({
      id: transcriptionId,
      finalText: editedText
    });
  };

  const handleCancel = () => {
    console.log('[TabbedViewer] Cancelando edição');
    setIsEditing(false);
    setEditedText(savedFinalText); // Restaurar do estado local
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    console.log('[TabbedViewer] 📋 Texto copiado da aba:', activeTab);
    toast.success('Texto copiado!');
  };

  const handleExport = () => {
    const blob = new Blob([currentText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcricao_${activeTab}_${transcriptionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('[TabbedViewer] 💾 Exportado:', activeTab);
    toast.success('Arquivo exportado!');
  };

  return (
    <div className='flex flex-col h-full bg-white'>
      {/* Tabs Header */}
      <div className='border-b bg-gray-50'>
        <div className='flex items-center justify-between px-6 py-2'>
          <div className='flex gap-1'>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (isEditing) {
                      toast.error('Salve ou cancele a edição antes de trocar de aba');
                      return;
                    }
                    console.log('[TabbedViewer] Trocando para aba:', tab.id);
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-white border-t-2 border-t-blue-600 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className='flex gap-2'>
            {activeTab === 'final' && !isEditing && (
              <button
                onClick={handleStartEdit}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors'
              >
                <Edit3 className='w-4 h-4' />
                Editar
              </button>
            )}

            {isEditing && (
              <>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className='flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50'
                >
                  <Save className='w-4 h-4' />
                  Salvar
                </button>
                <button
                  onClick={handleCancel}
                  className='flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700'
                >
                  <X className='w-4 h-4' />
                  Cancelar
                </button>
              </>
            )}

            {!isEditing && (
              <>
                <button
                  onClick={handleCopy}
                  className='flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200'
                >
                  <Copy className='w-4 h-4' />
                  Copiar
                </button>
                <button
                  onClick={handleExport}
                  className='flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200'
                >
                  <Download className='w-4 h-4' />
                  Exportar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Description */}
        <div className='px-6 py-2 text-sm text-gray-600 bg-blue-50 border-t'>
          {currentTab.description}
        </div>
      </div>

      {/* Content Area */}
      <div className='flex-1 overflow-hidden'>
        {activeTab === 'final' ? (
          // Aba Final: Um único componente Quill que troca apenas readOnly
          <RichTextEditor
            key='final-editor'
            value={isEditing ? editedText : savedFinalText}
            onChange={(value) => {
              console.log('[TabbedViewer] Text changed:', value.length);
              setEditedText(value);
            }}
            readOnly={!isEditing}
            placeholder={isEditing ? 'Digite o texto final...' : ''}
          />
        ) : (
          // Abas Raw/Corrected: Readonly sempre, com key diferente para forçar remontagem
          <RichTextEditor
            key={`${activeTab}-viewer`}
            value={currentTab.content}
            onChange={() => {}}
            readOnly={true}
          />
        )}
      </div>

      {/* Footer com status */}
      {isEditing && (
        <div className='border-t px-6 py-2 bg-yellow-50 text-sm text-yellow-800'>
          ⚠️ Modo de edição ativo - Salve ou cancele antes de trocar de aba
        </div>
      )}
    </div>
  );
}
