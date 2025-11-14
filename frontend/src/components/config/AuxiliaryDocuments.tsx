import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '../common/Button';
import toast from 'react-hot-toast';
import { Upload, FileText, Trash2, AlertCircle } from 'lucide-react';

interface AuxiliaryDocumentsProps {
  transcriptionId: number;
}

export function AuxiliaryDocuments({ transcriptionId }: AuxiliaryDocumentsProps) {
  const [isUploading, setIsUploading] = useState(false);

  // Query para listar documentos
  const { data: documents, isLoading, refetch } = trpc.auxiliaryDocs.list.useQuery(
    { transcriptionId },
    { enabled: !!transcriptionId }
  );

  // Mutation para upload
  const uploadMutation = trpc.auxiliaryDocs.upload.useMutation({
    onSuccess: () => {
      toast.success('Documento enviado com sucesso!');
      setIsUploading(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao enviar documento');
      setIsUploading(false);
    },
  });

  // Mutation para delete
  const deleteMutation = trpc.auxiliaryDocs.delete.useMutation({
    onSuccess: () => {
      toast.success('Documento removido');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover documento');
    },
  });

  // Handler do upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Apenas arquivos PDF ou DOCX são permitidos');
      return;
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande (máximo 10MB)');
      return;
    }

    console.log('[AuxDocs] 📤 Iniciando upload:', {
      name: file.name,
      type: file.type,
      size: (file.size / 1024).toFixed(2) + ' KB',
    });

    setIsUploading(true);

    try {
      // Converter para base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1]; // Remover prefixo data:...;base64,

        console.log('[AuxDocs] 📊 Base64 length:', base64Data.length);

        // Enviar para backend
        await uploadMutation.mutateAsync({
          transcriptionId,
          filename: file.name,
          fileData: base64Data,
          fileType: file.type,
        });
      };

      reader.onerror = () => {
        toast.error('Erro ao ler arquivo');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('[AuxDocs] ❌ Erro no upload:', error);
      toast.error(error.message || 'Erro ao fazer upload');
      setIsUploading(false);
    }

    // Limpar input
    event.target.value = '';
  };

  // Handler do delete
  const handleDelete = (id: number, filename: string) => {
    if (!confirm(`Remover documento "${filename}"?`)) return;

    console.log('[AuxDocs] 🗑️ Removendo documento:', id);
    deleteMutation.mutate({ id });
  };

  return (
    <div className="space-y-4">
      {/* Header com Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-blue-900 mb-1">
            Documentos Auxiliares
          </h4>
          <p className="text-sm text-blue-700">
            📄 Os documentos enviados serão usados pelo Claude como contexto na próxima correção.
            Isso ajuda o Claude a entender siglas, nomes específicos e contexto da reunião.
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <input
          type="file"
          id="doc-upload"
          accept=".pdf,.docx,.doc"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
        />
        <label
          htmlFor="doc-upload"
          className="cursor-pointer flex flex-col items-center gap-3"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              {isUploading ? 'Enviando...' : 'Clique para enviar documento'}
            </p>
            <p className="text-xs text-gray-500">
              PDF ou DOCX (máximo 10MB)
            </p>
          </div>
        </label>
      </div>

      {/* Documents List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">
          Documentos Anexados ({documents?.length || 0})
        </h4>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Carregando documentos...
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(doc.uploadedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDelete(doc.id, doc.filename)}
                  disabled={deleteMutation.isLoading}
                  title="Remover documento"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm">Nenhum documento anexado ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
