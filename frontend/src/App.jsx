// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Capture from './pages/Capture';

function App() {
  // Futuramente: verificar autenticação real
  const isAuthenticated = true; // Simulando usuário autenticado

  return (
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rotas Protegidas */}
        <Route
          path="/"
          element={isAuthenticated ? <Home /> : <Navigate to="/login" />}
        />
        <Route
          path="/capture"
          element={isAuthenticated ? <Capture /> : <Navigate to="/login" />}
        />

        {/* Rota 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-6">Página não encontrada</p>
                <a
                  href="/"
                  className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  Voltar ao Início
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;