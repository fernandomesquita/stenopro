import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import toast from 'react-hot-toast';
import { Save, Trash2, Plus, Check, Settings as SettingsIcon, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'prompts' | 'glossary'>('prompts');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-gray-700" />
            <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Voltar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'prompts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Prompts de Correção
          </button>
          <button
            onClick={() => setActiveTab('glossary')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'glossary'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Glossário
          </button>
        </div>

        {/* Content */}
        {activeTab === 'prompts' && <PromptsTab />}
        {activeTab === 'glossary' && <GlossaryTab />}
      </div>
    </div>
  );
}

function PromptsTab() {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingName, setEditingName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // @ts-ignore
  const { data: templatesRaw = [], refetch } = trpc.promptTemplates.list.useQuery();

  // Ordenar: padrão primeiro, depois alfabético
  const templates = [...templatesRaw].sort((a: any, b: any) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.name.localeCompare(b.name);
  });

  // @ts-ignore
  const createMutation = trpc.promptTemplates.create.useMutation({
    onSuccess: () => {
      toast.success('Template criado com sucesso!');
      refetch();
      setIsCreating(false);
      setEditingName('');
      setEditingText('');
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao criar template: ' + error.message);
    },
  });

  // @ts-ignore
  const updateMutation = trpc.promptTemplates.update.useMutation({
    onSuccess: () => {
      toast.success('Template atualizado!');
      refetch();
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  // @ts-ignore
  const deleteMutation = trpc.promptTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success('Template deletado!');
      refetch();
      setSelectedTemplate(null);
      setEditingText('');
      setEditingName('');
    },
    onError: (error: any) => {
      toast.error('Erro ao deletar: ' + error.message);
    },
  });

  // @ts-ignore
  const setDefaultMutation = trpc.promptTemplates.update.useMutation({
    onSuccess: () => {
      toast.success('Template marcado como padrão!');
      refetch();
    },
    onError: (error: any) => {
      toast.error('Erro ao marcar como padrão: ' + error.message);
    },
  });

  const handleSave = () => {
    if (!editingName.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    if (!editingText.trim() || editingText.trim().length < 10) {
      toast.error('O texto do prompt deve ter pelo menos 10 caracteres');
      return;
    }

    if (isCreating) {
      createMutation.mutate({
        name: editingName.trim(),
        promptText: editingText.trim(),
        isDefault: false,
      });
    } else if (selectedTemplate) {
      updateMutation.mutate({
        id: selectedTemplate,
        name: editingName.trim(),
        promptText: editingText.trim(),
      });
    }
  };

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template.id);
    setEditingText(template.promptText);
    setEditingName(template.name);
    setIsCreating(false);
  };

  const handleSetAsDefault = () => {
    if (selectedTemplate) {
      setDefaultMutation.mutate({
        id: selectedTemplate,
        isDefault: true,
      });
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedTemplate(null);
    setEditingText('');
    setEditingName('Novo Template');
  };

  const handleDelete = () => {
    if (selectedTemplate) {
      const template = templates.find((t: any) => t.id === selectedTemplate);

      if (template?.isDefault) {
        toast.error('Não é possível deletar o template padrão!');
        return;
      }

      if (window.confirm(`Tem certeza que deseja deletar '${template?.name}'?`)) {
        deleteMutation.mutate({ id: selectedTemplate });
      }
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Lista de templates */}
      <div className="col-span-1 bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg text-gray-900">Templates</h2>
          <button
            onClick={handleCreateNew}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Nenhum template criado.
              <br />
              Clique em + para criar.
            </div>
          ) : (
            templates.map((template: any) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`w-full text-left p-3 rounded transition-all ${
                  selectedTemplate === template.id
                    ? (template.isDefault
                        ? 'bg-green-50 border-2 border-green-600 shadow-md'
                        : 'bg-blue-50 border-2 border-blue-600')
                    : (template.isDefault
                        ? 'border-2 border-green-300 hover:border-green-400 hover:bg-green-50'
                        : 'border border-gray-200 hover:bg-gray-50')
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${template.isDefault ? 'text-green-700' : 'text-gray-900'}`}>
                    {template.name}
                  </span>
                  {selectedTemplate === template.id && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </div>

                {template.isDefault && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    ✓ Padrão
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="col-span-2 bg-white rounded-lg shadow p-6">
        {selectedTemplate || isCreating ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Template
              </label>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                placeholder="Ex: Correção Parlamentar Formal"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instruções para o Claude
              </label>
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className="w-full h-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none transition-shadow"
                placeholder="Digite as instruções que o Claude deve seguir ao corrigir as transcrições...&#10;&#10;Exemplo:&#10;Você é um assistente especializado em transcrições parlamentares. Corrija o texto seguindo estas regras:&#10;1. Preserve todos os nomes de oradores no formato 'O SR. NOME' ou 'A SRA. NOME'&#10;2. Corrija erros gramaticais e ortográficos&#10;3. Organize em parágrafos quando mudar de assunto&#10;4. Mantenha a formalidade parlamentar"
                spellCheck={false}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending || createMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {isCreating ? 'Criar Template' : 'Salvar Alterações'}
              </button>

              {!isCreating && selectedTemplate && (
                <>
                  {!templates.find((t: any) => t.id === selectedTemplate)?.isDefault ? (
                    <button
                      onClick={handleSetAsDefault}
                      disabled={setDefaultMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Marcar como Padrão
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg border border-green-300">
                      <Check className="w-4 h-4" />
                      Template Padrão
                    </div>
                  )}

                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending || templates.find((t: any) => t.id === selectedTemplate)?.isDefault}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-auto"
                    title={templates.find((t: any) => t.id === selectedTemplate)?.isDefault ? 'Não é possível deletar o template padrão' : ''}
                  >
                    <Trash2 className="w-4 h-4" />
                    Deletar
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <SettingsIcon className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-600 mb-2">
              Nenhum template selecionado
            </p>
            <p className="text-sm text-gray-500">
              Selecione um template à esquerda ou crie um novo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function GlossaryTab() {
  const [activeTab, setActiveTab] = useState<'deputy' | 'term'>('deputy');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingTerm, setEditingTerm] = useState('');
  const [editingSpelling, setEditingSpelling] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Batch upload states
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [batchText, setBatchText] = useState('');

  // @ts-ignore
  const { data: allTerms = [], refetch } = trpc.glossaryTerms.list.useQuery({});

  // Filtrar por tipo
  const terms = allTerms.filter((t: any) => t.type === activeTab);

  // @ts-ignore
  const createMutation = trpc.glossaryTerms.create.useMutation({
    onSuccess: () => {
      toast.success('Termo criado!');
      refetch();
      setIsCreating(false);
      setEditingTerm('');
      setEditingSpelling('');
      setEditingNotes('');
    },
    onError: (error: any) => {
      toast.error('Erro: ' + error.message);
    }
  });

  // @ts-ignore
  const updateMutation = trpc.glossaryTerms.update.useMutation({
    onSuccess: () => {
      toast.success('Atualizado!');
      refetch();
    },
    onError: (error: any) => {
      toast.error('Erro: ' + error.message);
    }
  });

  // @ts-ignore
  const deleteMutation = trpc.glossaryTerms.delete.useMutation({
    onSuccess: () => {
      toast.success('Deletado!');
      refetch();
      setSelectedId(null);
      setEditingTerm('');
      setEditingSpelling('');
      setEditingNotes('');
    },
    onError: (error: any) => {
      toast.error('Erro: ' + error.message);
    }
  });

  // @ts-ignore
  const batchMutation = trpc.glossaryTerms.uploadBatch.useMutation({
    onSuccess: (data: any) => {
      toast.success(`${data.count} termos importados!`);
      refetch();
      setShowBatchUpload(false);
      setBatchText('');
    },
    onError: (error: any) => {
      toast.error('Erro no batch: ' + error.message);
    }
  });

  const handleSelectTerm = (term: any) => {
    setSelectedId(term.id);
    setEditingTerm(term.term);
    setEditingSpelling(term.correctSpelling);
    setEditingNotes(term.notes || '');
    setIsCreating(false);
    setShowBatchUpload(false);
  };

  const handleNewTerm = () => {
    setIsCreating(true);
    setSelectedId(null);
    setEditingTerm('');
    setEditingSpelling('');
    setEditingNotes('');
    setShowBatchUpload(false);
  };

  const handleSave = () => {
    if (!editingTerm.trim() || !editingSpelling.trim()) {
      toast.error('Termo e grafia são obrigatórios');
      return;
    }

    if (isCreating) {
      console.log('[Glossary] Criando:', editingTerm, '→', editingSpelling);
      createMutation.mutate({
        type: activeTab,
        term: editingTerm.trim(),
        correctSpelling: editingSpelling.trim(),
        notes: editingNotes.trim() || undefined
      });
    } else if (selectedId) {
      console.log('[Glossary] Atualizando:', selectedId);
      updateMutation.mutate({
        id: selectedId,
        term: editingTerm.trim(),
        correctSpelling: editingSpelling.trim(),
        notes: editingNotes.trim() || undefined
      });
    }
  };

  const handleBatchUpload = () => {
    const lines = batchText.split('\n').filter(line => line.trim());
    const items = lines.map(line => {
      const parts = line.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        return { term: parts[0], correctSpelling: parts[1] };
      }
      return null;
    }).filter(Boolean) as { term: string; correctSpelling: string }[];

    if (items.length === 0) {
      toast.error('Nenhum termo válido. Use formato: termo,Grafia Correta');
      return;
    }

    console.log('[Glossary] Upload batch:', items.length, 'itens');
    batchMutation.mutate({ type: activeTab, items });
  };

  const handleDelete = () => {
    if (!selectedId) return;

    const term = terms.find((t: any) => t.id === selectedId);
    if (window.confirm(`Deletar "${term?.term}"?`)) {
      deleteMutation.mutate({ id: selectedId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📚 Glossário Global</h3>
        <p className="text-sm text-blue-700">
          Todos os termos aqui serão automaticamente aplicados por Claude em todas as transcrições.
          Um relatório será gerado ao final mostrando quais termos foram usados.
        </p>
        <div className="mt-2 flex gap-4 text-sm">
          <span className="text-blue-600">👤 {allTerms.filter((t: any) => t.type === 'deputy').length} deputados</span>
          <span className="text-blue-600">📝 {allTerms.filter((t: any) => t.type === 'term').length} termos gerais</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => {
            setActiveTab('deputy');
            setSelectedId(null);
            setIsCreating(false);
          }}
          className={`px-4 py-2 border-b-2 font-medium ${
            activeTab === 'deputy'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          👤 Deputados ({allTerms.filter((t: any) => t.type === 'deputy').length})
        </button>
        <button
          onClick={() => {
            setActiveTab('term');
            setSelectedId(null);
            setIsCreating(false);
          }}
          className={`px-4 py-2 border-b-2 font-medium ${
            activeTab === 'term'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          📝 Termos Gerais ({allTerms.filter((t: any) => t.type === 'term').length})
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Coluna 1: Lista de termos */}
        <div className="col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">
              {activeTab === 'deputy' ? '👤 Deputados' : '📝 Termos'}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBatchUpload(!showBatchUpload)}
                className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Upload em lote (CSV)"
              >
                <Upload className="w-5 h-5" />
              </button>
              <button
                onClick={handleNewTerm}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Adicionar termo"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Upload em batch */}
          {showBatchUpload && (
            <div className="p-4 bg-gray-50 border-b">
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Upload em Lote (CSV)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Formato: <code className="bg-gray-200 px-1">termo,Grafia Correta</code>
                </p>
              </div>
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={`internet,Internet\ncop-30,COP 30\n${activeTab === 'deputy' ? 'joão silva,João Silva' : 'blockchain,Blockchain'}`}
                className="w-full h-32 text-xs p-2 border rounded mb-2 font-mono focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleBatchUpload}
                  disabled={batchMutation.isPending}
                  className="flex-1 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {batchMutation.isPending ? 'Importando...' : 'Importar'}
                </button>
                <button
                  onClick={() => {
                    setShowBatchUpload(false);
                    setBatchText('');
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista scrollable */}
          <div className="p-2 space-y-1 max-h-[600px] overflow-y-auto">
            {terms.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Nenhum termo cadastrado</p>
                <p className="text-xs mt-1">Clique em + para adicionar</p>
              </div>
            ) : (
              terms.map((term: any) => (
                <button
                  key={term.id}
                  onClick={() => handleSelectTerm(term)}
                  className={`w-full text-left p-3 rounded border transition-all ${
                    selectedId === term.id
                      ? 'bg-blue-50 border-blue-600 shadow-sm'
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{term.term}</div>
                  <div className="text-xs text-gray-600 mt-0.5">→ {term.correctSpelling}</div>
                  {term.notes && (
                    <div className="text-xs text-gray-400 mt-1 italic truncate">
                      {term.notes}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Coluna 2-3: Editor */}
        <div className="col-span-2 bg-white rounded-lg shadow p-6">
          {(selectedId || isCreating) ? (
            <>
              <h3 className="text-lg font-semibold mb-4">
                {isCreating ? '➕ Novo Termo' : '✏️ Editar Termo'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Termo ou Nome (como pode aparecer na transcrição)
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingTerm}
                    onChange={(e) => setEditingTerm(e.target.value)}
                    placeholder={activeTab === 'deputy' ? 'ex: joao silva, joão silva' : 'ex: internet, cop-30'}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {activeTab === 'deputy'
                      ? 'Digite o nome como pode aparecer (minúsculas, sem acentos, etc)'
                      : 'Digite o termo como pode aparecer incorretamente'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grafia Correta (como deve aparecer no texto final)
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingSpelling}
                    onChange={(e) => setEditingSpelling(e.target.value)}
                    placeholder={activeTab === 'deputy' ? 'ex: João Silva' : 'ex: Internet, COP 30'}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta será a grafia EXATA que aparecerá no texto corrigido
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    placeholder="Ex: Partido, Estado, contexto..."
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {isCreating ? 'Criar Termo' : 'Salvar Alterações'}
                  </button>

                  {!isCreating && selectedId && (
                    <button
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Deletar
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedId(null);
                      setEditingTerm('');
                      setEditingSpelling('');
                      setEditingNotes('');
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="text-gray-400 mb-4">
                <Plus className="w-16 h-16 mx-auto mb-2 opacity-30" />
              </div>
              <p className="text-gray-500 text-lg mb-2">Nenhum termo selecionado</p>
              <p className="text-gray-400 text-sm mb-4">
                Selecione um termo da lista ou crie um novo
              </p>
              <button
                onClick={handleNewTerm}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Adicionar Novo Termo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
