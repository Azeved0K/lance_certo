import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Capture from './pages/Capture';
import Profile from './pages/Profile';
import VideoPlayer from './pages/VideoPlayer';
import NotificationsPage from './pages/Notifications.jsx';

// Componente interno que usa o contexto
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Rotas Publicas */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" /> : <Register />}
      />

      {/* Rotas Protegidas */}
      <Route
        path="/"
        element={user ? <Home /> : <Navigate to="/login" />}
      />
      <Route
        path="/capture"
        element={user ? <Capture /> : <Navigate to="/login" />}
      />
      <Route
        path="/profile"
        element={user ? <Profile /> : <Navigate to="/login" />}
      />

      {/* Notificações */}
      <Route
        path="/notificacoes"
        element={user ? <NotificationsPage /> : <Navigate to="/login" />}
      />

      {/* Player de Vídeo */}
      <Route
        path="/video/:id"
        element={<VideoPlayer />}
      />

      {/* Rota 404 */}
      <Route
        path="*"
        element={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--gray-50)',
            textAlign: 'center',
            padding: '2rem'
          }}>
            <div>
              <h1 style={{
                fontSize: '4rem',
                fontWeight: 'bold',
                color: 'var(--gray-800)',
                marginBottom: '1rem'
              }}>
                404
              </h1>
              <p style={{
                fontSize: '1.25rem',
                color: 'var(--gray-600)',
                marginBottom: '1.5rem'
              }}>
                Pagina não encontrada
              </p>
              <a
                href="/"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}
              >
                Voltar ao Início
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;