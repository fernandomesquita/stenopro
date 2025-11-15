import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ArrowLeft, Upload, FileAudio, X } from 'lucide-react';

export function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // @ts-ignore - Tipo temporário do tRPC
  const uploadMutation = trpc.transcriptions.create.useMutation({
    onSuccess: (data: any) => {
      console.log('[Upload] ✅ Sucesso:', data);
      toast.success('🎉 Upload realizado com sucesso!');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    },
    onError: (error: any) => {
      console.error('[Upload] ❌ Erro:', error);
      toast.error('Erro no upload: ' + error.message);
      setUploading(false);
      setProgress(0);
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar tipo
    if (!selectedFile.type.startsWith('audio/')) {
      toast.error('❌ Por favor, selecione um arquivo de áudio');
      return;
    }

    // Validar tamanho (max 25MB)
    if (selectedFile.size > 25 * 1024 * 1024) {
      toast.error('❌ Arquivo muito grande (máx 25MB)');
      return;
    }

    console.log('[Upload] Arquivo selecionado:', {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type
    });

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    console.log('[Upload] Iniciando upload...');
    setUploading(true);
    setProgress(0);

    try {
      // Converter arquivo para base64
      console.log('[Upload] Convertendo arquivo para base64...');
      setProgress(10);

      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1]; // Remove "data:audio/...;base64,"

          console.log('[Upload] Base64 criado, size:', base64.length);
          setProgress(30);

          // Criar transcrição via tRPC com arquivo base64
          uploadMutation.mutate({
            title: file.name.replace(/\.[^/.]+$/, ''),
            audioFile: {
              buffer: base64,
              filename: file.name,
              mimetype: file.type,
            }
          });

          setProgress(100);
        } catch (error: any) {
          console.error('[Upload] Erro ao processar base64:', error);
          toast.error('Erro ao processar arquivo: ' + error.message);
          setUploading(false);
          setProgress(0);
        }
      };

      reader.onerror = () => {
        console.error('[Upload] Erro ao ler arquivo');
        toast.error('Erro ao ler arquivo');
        setUploading(false);
        setProgress(0);
      };

      reader.readAsDataURL(file);

    } catch (error: any) {
      console.error('[Upload] Erro:', error);
      toast.error('Erro ao fazer upload: ' + error.message);
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'>
      {/* Header */}
      <header className='bg-gradient-primary text-white shadow-elevated'>
        <div className='max-w-7xl mx-auto px-6 py-8'>
          <div className='flex items-center gap-4'>
            <Link
              to='/'
              className='flex items-center gap-2 text-white hover:text-blue-100 transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
              Voltar
            </Link>
            <div className='border-l border-white/20 pl-4'>
              <h1 className='text-4xl font-bold flex items-center gap-3'>
                <Upload className='w-10 h-10' />
                Novo Upload
              </h1>
              <p className='text-blue-100 text-lg'>
                Faça upload de um áudio para transcrever
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className='max-w-3xl mx-auto px-6 py-12'>
        <div className='bg-white rounded-2xl shadow-elevated p-8'>
          {!file ? (
            // Área de upload
            <div className='text-center'>
              <div className='mb-8'>
                <div className='w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4'>
                  <FileAudio className='w-12 h-12 text-white' />
                </div>
                <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                  Selecione um arquivo de áudio
                </h2>
                <p className='text-gray-600'>
                  Formatos suportados: MP3, WAV, M4A (máx 25MB)
                </p>
              </div>

              <label className='cursor-pointer'>
                <input
                  type='file'
                  accept='audio/*'
                  onChange={handleFileSelect}
                  className='hidden'
                />
                <span className='inline-flex items-center gap-2 px-8 py-4 bg-gradient-primary text-white rounded-xl font-semibold hover:shadow-hover transform hover:scale-105 transition-all duration-200'>
                  <Upload className='w-5 h-5' />
                  Selecionar Arquivo
                </span>
              </label>
            </div>
          ) : (
            // Arquivo selecionado
            <div className='space-y-6'>
              <div className='flex items-center justify-between p-4 bg-blue-50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <FileAudio className='w-8 h-8 text-blue-600' />
                  <div>
                    <div className='font-semibold text-gray-900'>{file.name}</div>
                    <div className='text-sm text-gray-600'>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>

                {!uploading && (
                  <button
                    onClick={() => setFile(null)}
                    className='p-2 hover:bg-red-100 rounded-lg transition-colors'
                  >
                    <X className='w-5 h-5 text-red-600' />
                  </button>
                )}
              </div>

              {uploading && (
                <ProgressBar
                  progress={progress}
                  label='Fazendo upload e processando...'
                  variant='primary'
                />
              )}

              {!uploading ? (
                <button
                  onClick={handleUpload}
                  className='w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-primary text-white rounded-xl font-semibold hover:shadow-hover transform hover:scale-105 transition-all duration-200'
                >
                  <Upload className='w-5 h-5' />
                  Iniciar Processamento
                </button>
              ) : (
                <div className='text-center py-4'>
                  <LoadingSpinner size='md' text='Aguarde...' />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
