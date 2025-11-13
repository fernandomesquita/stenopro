function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🏛️ StenoPro
        </h1>
        <p className="text-lg text-gray-600">
          Sistema de Transcrição Parlamentar Automatizada
        </p>
      </header>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Status do Sistema</h2>
        
        <div className="space-y-3">
          <StatusItem
            label="Frontend"
            status="online"
          />
          <StatusItem
            label="Backend"
            status="aguardando configuração"
          />
          <StatusItem
            label="Banco de Dados"
            status="aguardando configuração"
          />
          <StatusItem
            label="Whisper API"
            status="aguardando configuração"
          />
          <StatusItem
            label="Claude API"
            status="configurado"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          📋 Próximos Passos
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Configurar banco de dados MySQL no Railway</li>
          <li>Configurar variáveis de ambiente (.env)</li>
          <li>Executar migrations do banco</li>
          <li>Iniciar o backend</li>
          <li>Testar upload de áudio</li>
        </ol>
      </div>
    </div>
  );
}

function StatusItem({ label, status }: { label: string; status: string }) {
  const isOnline = status === 'online' || status === 'configurado';
  
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
      <span className="font-medium text-gray-700">{label}</span>
      <span className={`
        px-3 py-1 rounded-full text-sm font-medium
        ${isOnline 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
        }
      `}>
        {status}
      </span>
    </div>
  );
}

export default HomePage;
