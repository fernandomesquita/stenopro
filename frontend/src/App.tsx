import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { EditorPage } from './pages/EditorPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/editor/:id" element={<EditorPage />} />
          {/* TODO: Adicionar mais rotas:
            - /settings (configurações)
            - /glossary (glossário)
          */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
