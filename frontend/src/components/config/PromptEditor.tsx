import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '../common/Button';
import toast from 'react-hot-toast';
import { Save, RefreshCw, Info } from 'lucide-react';

interface PromptEditorProps {
  transcriptionId: number;
  currentPrompt?: string;
  onSave?: (prompt: string) => void;
}

export function PromptEditor({
  transcriptionId,
  currentPrompt = '',
  onSave,
}: PromptEditorProps) {
  const [promptText, setPromptText] = useState(currentPrompt);
  const [isSaving, setIsSaving] = useState(false);

  // Query para pegar template padrão
  const { data: defaultTemplate } = trpc.promptTemplates.getDefault.useQuery();

  // Query para listar todos os templates
  const { data: templates, refetch: refetchTemplates } = trpc.promptTemplates.list.useQuery();

  // Mutation para atualizar transcrição com custom prompt
  const updateTranscriptionMutation = trpc.transcriptions.update.useMutation({
    onSuccess: () => {
      toast.success('Prompt personalizado salvo!');
      setIsSaving(false);
      onSave?.(promptText);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao salvar prompt');
      setIsSaving(false);
    },
  });

  // Atualizar prompt quando currentPrompt mudar
  useEffect(() => {
    if (currentPrompt) {
      setPromptText(currentPrompt);
    }
  }, [currentPrompt]);

  // Handler: Salvar prompt personalizado
  const handleSave = () => {
    if (!promptText.trim()) {
      toast.error('O prompt não pode estar vazio');
      return;
    }

    console.log('[PromptEditor] 💾 Salvando prompt personalizado:', {
      transcriptionId,
      length: promptText.length,
    });

    setIsSaving(true);

    updateTranscriptionMutation.mutate({
      id: transcriptionId,
      customPrompt: promptText,
    });
  };

  // Handler: Usar template padrão
  const handleUseDefault = () => {
    if (!defaultTemplate || defaultTemplate.length === 0) {
      toast.error('Nenhum template padrão encontrado');
      return;
    }

    const template = defaultTemplate[0];
    setPromptText(template.promptText);
    toast.success(`Template "${template.name}" carregado`);
  };

  // Handler: Limpar prompt personalizado (volta ao padrão)
  const handleClear = () => {
    if (!confirm('Remover prompt personalizado? A transcrição usará o prompt padrão.')) {
      return;
    }

    console.log('[PromptEditor] 🗑️ Removendo prompt personalizado');

    setIsSaving(true);

    updateTranscriptionMutation.mutate({
      id: transcriptionId,
      customPrompt: null,
    });

    setPromptText('');
  };

  return (
    <div className="space-y-4">
      {/* Header com Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-purple-900 mb-1">
            Prompt Personalizado
          </h4>
          <p className="text-sm text-purple-700 mb-2">
            🤖 Customize as instruções para o Claude. Use variáveis dinâmicas:
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <code className="px-2 py-1 bg-purple-100 rounded font-mono">
              {'{titulo}'}
            </code>
            <code className="px-2 py-1 bg-purple-100 rounded font-mono">
              {'{data}'}
            </code>
            <code className="px-2 py-1 bg-purple-100 rounded font-mono">
              {'{sala}'}
            </code>
            <code className="px-2 py-1 bg-purple-100 rounded font-mono">
              {'{duracao}'}
            </code>
          </div>
        </div>
      </div>

      {/* Prompt Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Instruções para o Claude
          </label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleUseDefault}
              disabled={isSaving}
              title="Carregar template padrão"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Usar Padrão
            </Button>
            {currentPrompt && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleClear}
                disabled={isSaving}
                title="Remover personalização"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>

        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Digite as instruções para o Claude formatar a transcrição..."
          className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-vertical"
          disabled={isSaving}
        />

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{promptText.length} caracteres</span>
          <span>
            {currentPrompt ? '✏️ Prompt personalizado ativo' : '📋 Usando prompt padrão'}
          </span>
        </div>
      </div>

      {/* Preview Section */}
      {promptText && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Preview (com variáveis substituídas)
          </h4>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm whitespace-pre-wrap font-mono text-gray-700">
            {promptText
              .replace(/{titulo}/g, 'Reunião da Comissão XYZ')
              .replace(/{data}/g, new Date().toLocaleDateString('pt-BR'))
              .replace(/{sala}/g, 'Plenário 1')
              .replace(/{duracao}/g, '45 minutos')}
          </div>
        </div>
      )}

      {/* Templates List */}
      {templates && templates.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Templates Salvos
          </h4>
          <div className="space-y-2">
            {templates.map((template: any) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {template.name}
                    {template.isDefault && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Padrão
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {template.promptText.substring(0, 80)}...
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setPromptText(template.promptText);
                    toast.success(`Template "${template.name}" carregado`);
                  }}
                  title="Usar este template"
                >
                  Usar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving || !promptText.trim()}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Prompt Personalizado'}
        </Button>
      </div>
    </div>
  );
}
