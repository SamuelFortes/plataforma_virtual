import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import RelatoriosSituacionais from './pages/RelatoriosSituacionais';
import SetupUbs from './pages/SetupUbs';
import GestorSolicitacoes from './pages/GestorSolicitacoes';
import Agendamento from './pages/Agendamento';
import Notificacoes from './pages/Notificacoes';
import MapaProblemasIntervencoes from './pages/MapaProblemasIntervencoes';
import MateriaisEducativos from './pages/MateriaisEducativos';
import Cronograma from './pages/Cronograma';
import SuporteFeedback from './pages/SuporteFeedback';
import GerenciarMensagens from './pages/GerenciarMensagens';
import GestaoEquipesMicroareas from './pages/GestaoEquipesMicroareas';
import RedefinirSenha from './pages/RedefinirSenha';
import EsqueciSenha from './pages/EsqueciSenha';
import NovaSenha from './pages/NovaSenha';
import Configuracoes from './pages/Configuracoes';
import GerenciarCargos from './pages/GerenciarCargos';
import GerenciarUbs from './pages/GerenciarUbs';
import AdminPanel from './pages/AdminPanel';
import AuthCallback from './pages/AuthCallback';
import NavBar from './components/NavBar';
import { NotificationsProvider } from './components/ui/Notifications';
import { api } from './services/api';

const ProtectedRoute = ({ children, allowedRoles, allowedCargos }) => {
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles || allowedCargos) {
    const isAdmin = user.role === 'ADMIN';
    const roleOk = allowedRoles && allowedRoles.includes(user.role);
    const cargoOk = allowedCargos && allowedCargos.includes(user.cargo);
    if (!isAdmin && !roleOk && !cargoOk) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

const UbsGate = ({ children }) => {
  const [status, setStatus] = useState({ loading: true, hasUbs: true });
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const isAdmin = user?.role === 'ADMIN';
  const isGestor = user?.role === 'GESTOR';

  useEffect(() => {
    if (isAdmin) {
      setStatus({ loading: false, hasUbs: true });
      return;
    }
    let active = true;
    const checkUbs = async () => {
      try {
        const data = await api.request('/ubs/configured', { requiresAuth: true });
        if (active) setStatus({ loading: false, hasUbs: data?.configured === true });
      } catch {
        if (active) setStatus({ loading: false, hasUbs: false });
      }
    };

    checkUbs();
    return () => { active = false; };
  }, [isAdmin]);

  if (status.loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!status.hasUbs) {
    if (isGestor) {
      return <Navigate to="/setup-ubs" replace />;
    }

    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h2 className="text-lg font-semibold">UBS ainda não configurada</h2>
          <p className="mt-2 text-sm text-amber-800">
            O sistema ainda não possui uma UBS cadastrada. Aguarde o administrador realizar a configuração inicial.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

const HIDE_NAV_PATHS = ['/login', '/register', '/auth/callback', '/esqueci-senha', '/nova-senha'];

const ConditionalNavBar = (props) => {
  const { pathname } = useLocation();
  if (HIDE_NAV_PATHS.includes(pathname)) return null;
  return <NavBar {...props} />;
};

function App() {
  const [isDark, setIsDark] = useState(false);

  const handleToggleTheme = () => {
    setIsDark((current) => !current);
  };

  return (
    <NotificationsProvider>
      <div className={isDark ? 'dark' : ''}>
        <Router>
          <ConditionalNavBar isDark={isDark} onToggleTheme={handleToggleTheme} />
          <main className="bg-gray-50 dark:bg-slate-950 min-h-screen page-enter">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login isDark={isDark} onToggleTheme={handleToggleTheme} />} />
              <Route path="/register" element={<Register isDark={isDark} onToggleTheme={handleToggleTheme} />} />
              <Route path="/esqueci-senha" element={<EsqueciSenha isDark={isDark} onToggleTheme={handleToggleTheme} />} />
              <Route path="/nova-senha" element={<NovaSenha isDark={isDark} onToggleTheme={handleToggleTheme} />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <UbsGate>
                    <Dashboard />
                  </UbsGate>
                </ProtectedRoute>
              } />
              
              <Route path="/agendamento" element={
                <ProtectedRoute allowedRoles={['USER', 'PROFISSIONAL', 'GESTOR']}>
                  <UbsGate>
                    <Agendamento />
                  </UbsGate>
                </ProtectedRoute>
              } />

              <Route path="/relatorios-situacionais" element={
                <ProtectedRoute allowedRoles={['USER', 'PROFISSIONAL', 'GESTOR']}>
                  <UbsGate>
                    <RelatoriosSituacionais />
                  </UbsGate>
                </ProtectedRoute>
              } />

              <Route path="/setup-ubs" element={
                <ProtectedRoute allowedRoles={['GESTOR']}>
                  <SetupUbs />
                </ProtectedRoute>
              } />

              <Route path="/solicitacoes" element={
                <ProtectedRoute allowedRoles={['GESTOR']}>
                  <UbsGate>
                    <GestorSolicitacoes />
                  </UbsGate>
                </ProtectedRoute>
              } />

              <Route path="/gerenciar-cargos" element={
                <ProtectedRoute allowedRoles={['GESTOR']}>
                  <GerenciarCargos />
                </ProtectedRoute>
              } />

              <Route path="/gerenciar-ubs" element={
                <ProtectedRoute allowedRoles={['GESTOR']}>
                  <GerenciarUbs />
                </ProtectedRoute>
              } />

              <Route path="/notificacoes" element={
                <ProtectedRoute allowedRoles={['GESTOR']} allowedCargos={['Recepcionista']}>
                  <UbsGate>
                    <Notificacoes />
                  </UbsGate>
                </ProtectedRoute>
              } />

              <Route path="/mapa-problemas-intervencoes" element={
                <ProtectedRoute allowedRoles={['USER', 'PROFISSIONAL', 'GESTOR']}>
                  <UbsGate>
                    <MapaProblemasIntervencoes />
                  </UbsGate>
                </ProtectedRoute>
              } />

              <Route path="/materiais-educativos" element={
                <ProtectedRoute allowedRoles={['USER', 'PROFISSIONAL', 'GESTOR']}>
                  <UbsGate>
                    <MateriaisEducativos />
                  </UbsGate>
                </ProtectedRoute>
              } />

              <Route path="/cronograma" element={
                <ProtectedRoute allowedRoles={['USER', 'PROFISSIONAL', 'GESTOR']}>
                  <UbsGate>
                    <Cronograma />
                  </UbsGate>
                </ProtectedRoute>
              } />

              <Route path="/suporte-feedback" element={
                <ProtectedRoute allowedRoles={['USER', 'PROFISSIONAL', 'GESTOR']}>
                  <UbsGate>
                    <SuporteFeedback />
                  </UbsGate>
                </ProtectedRoute>
              } />

              <Route path="/gerenciar-mensagens" element={
                <ProtectedRoute allowedRoles={['GESTOR']} allowedCargos={['Recepcionista']}>
                  <UbsGate>
                    <GerenciarMensagens />
                  </UbsGate>
                </ProtectedRoute>
              } />

              <Route path="/gestao-equipes" element={
                <ProtectedRoute allowedRoles={['GESTOR']} allowedCargos={['Recepcionista']}>
                  <UbsGate>
                    <GestaoEquipesMicroareas />
                  </UbsGate>
                </ProtectedRoute>
              } />

              <Route path="/redefinir-senha" element={
                <ProtectedRoute allowedRoles={['GESTOR']} allowedCargos={['Recepcionista']}>
                  <UbsGate>
                    <RedefinirSenha />
                  </UbsGate>
                </ProtectedRoute>
              } />

              <Route path="/configuracoes" element={
                <ProtectedRoute>
                  <Configuracoes />
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminPanel />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </Router>
      </div>
    </NotificationsProvider>
  );
}

export default App;
