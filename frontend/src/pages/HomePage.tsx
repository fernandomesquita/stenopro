import { useState } from 'react';
import { UploadArea } from '../components/transcriptions/UploadArea';
import { TranscriptionList } from '../components/transcriptions/TranscriptionList';

function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    // Forçar atualização da lista quando um novo upload for bem-sucedido
    setRefreshKey((prev) => prev + 1);
  };

  const handleEdit = (id: number) => {
    // TODO: Navegar para página de edição
    console.log('Edit transcription:', id);
    alert(`Edição da transcrição ${id} será implementada no próximo módulo`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            StenoPro
          </h1>
          <p className="text-gray-600">
            Sistema de Transcrição Parlamentar Automatizada
          </p>
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
