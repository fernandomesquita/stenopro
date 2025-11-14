import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadArea } from '../components/transcriptions/UploadArea';
import { TranscriptionList } from '../components/transcriptions/TranscriptionList';

function HomePage() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    // Forçar atualização da lista quando um novo upload for bem-sucedido
    setRefreshKey((prev) => prev + 1);
  };

  const handleEdit = (id: number) => {
    navigate(`/editor/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                StenoPro
              </h1>
              <p className="text-gray-600">
                Sistema de Transcrição Parlamentar Automatizada
              </p>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configurações
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna esquerda: Upload */}
          <div className="lg:col-span-1">
            <UploadArea onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Coluna direita: Lista */}
          <div className="lg:col-span-2">
            <TranscriptionList key={refreshKey} onEdit={handleEdit} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-500">
            StenoPro &copy; 2025 - Sistema de Transcrição Parlamentar
          </p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
