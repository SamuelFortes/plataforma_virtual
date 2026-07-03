import { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BellIcon,
  ArrowRightOnRectangleIcon,
  Squares2X2Icon,
  UserCircleIcon,
  MoonIcon,
  SunIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  ArrowUpCircleIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { ubsService } from '../services/ubsService';
import { api } from '../services/api';
import { useNotifications } from './ui/Notifications';

const SolicitarAcessoModal = ({ user, onClose }) => {
  const { notify } = useNotifications();
  const userRole = (user?.role || 'USER').toUpperCase();
  const [cargos, setCargos] = useState([]);
  const [form, setForm] = useState({ cargo: '', registro_profissional: '' });
  const [minhaSolicitacao, setMinhaSolicitacao] = useState(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [cargosData, solData] = await Promise.allSettled([
          api.request('/cargos', { requiresAuth: true }),
          api.request('/auth/professional-requests/me', { requiresAuth: true }),
        ]);
        if (cargosData.status === 'fulfilled') setCargos(Array.isArray(cargosData.value) ? cargosData.value : []);
        if (solData.status === 'fulfilled') setMinhaSolicitacao(solData.value);
        else setMinhaSolicitacao(null);
      } catch {
        setMinhaSolicitacao(null);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cargo || !form.registro_profissional.trim()) {
      notify({ type: 'warning', message: 'Preencha todos os campos.' });
      return;
    }
    setLoading(true);
    try {
      await api.request('/auth/professional-requests', {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify({ cargo: form.cargo, registro_profissional: form.registro_profissional.trim() }),
      });
      notify({ type: 'success', message: 'Solicitação enviada! Aguarde a aprovação do gestor.' });
      onClose();
    } catch (err) {
      notify({ type: 'error', message: err.message || 'Erro ao enviar solicitação.' });
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    PENDING: { label: 'Pendente', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    APPROVED: { label: 'Aprovado', cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    REJECTED: { label: 'Rejeitado', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Solicitar acesso profissional</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {minhaSolicitacao === undefined && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-cyan-600" />
          </div>
        )}

        {minhaSolicitacao !== undefined && minhaSolicitacao !== null && (minhaSolicitacao.status === 'PENDING' || (minhaSolicitacao.status === 'APPROVED' && userRole !== 'USER')) && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-slate-400">Você já possui uma solicitação:</p>
            <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800 dark:text-slate-200">{minhaSolicitacao.cargo}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig[minhaSolicitacao.status]?.cls}`}>
                  {statusConfig[minhaSolicitacao.status]?.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">Registro: {minhaSolicitacao.registro_profissional}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                Enviado em {new Date(minhaSolicitacao.submitted_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        )}

        {minhaSolicitacao !== undefined && (minhaSolicitacao === null || minhaSolicitacao?.status === 'REJECTED' || (minhaSolicitacao?.status === 'APPROVED' && userRole === 'USER')) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {minhaSolicitacao?.status === 'REJECTED' && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                Sua solicitação anterior foi rejeitada{minhaSolicitacao.rejection_reason ? `: ${minhaSolicitacao.rejection_reason}` : '.'}{' '}
                Você pode reenviar abaixo.
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Informe seu cargo e número de registro profissional. O gestor da UBS irá analisar sua solicitação.
            </p>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Cargo</label>
              {cargos.length > 0 ? (
                <select
                  value={form.cargo}
                  onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                >
                  <option value="">Selecione um cargo</option>
                  {cargos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.cargo}
                  onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                  placeholder="Ex: Médico, Enfermeiro, ACS..."
                  required
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Registro Profissional</label>
              <input
                type="text"
                value={form.registro_profissional}
                onChange={e => setForm(f => ({ ...f, registro_profissional: e.target.value }))}
                placeholder="Ex: CRM-PI 12345, COREN-PI 67890..."
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const NavBar = ({ isDark, onToggleTheme }) => {
  const location = useLocation();
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const [hasUbs, setHasUbs] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [solicitarModalOpen, setSolicitarModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const isActive = (path) => location.pathname === path;
  const role = (user?.role || 'USER').toUpperCase();
  const isAdmin = role === 'ADMIN';
  const roleLabel = isAdmin ? 'Admin' : role.toLowerCase();
  const canSetupUbs = ['PROFISSIONAL', 'GESTOR', 'ADMIN'].includes(role);

  useEffect(() => {
    let active = true;
    const loadUbs = async () => {
      if (!canSetupUbs) return;
      try {
        const data = await ubsService.getSingleUbs();
        if (active) setHasUbs(Boolean(data));
      } catch {
        if (active) setHasUbs(false);
      }
    };
    loadUbs();
    return () => { active = false; };
  }, [canSetupUbs]);

  useEffect(() => {
    if (role !== 'GESTOR' && !isAdmin) return;
    let active = true;
    const loadPending = async () => {
      try {
        const data = await api.request('/auth/professional-requests/pending-count', { requiresAuth: true });
        if (active) setPendingCount(data?.count ?? 0);
      } catch { /* silently ignore */ }
    };
    loadPending();
    return () => { active = false; };
  }, [role, isAdmin]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const userInitial = user.nome ? user.nome.charAt(0).toUpperCase() : '?';

  return (
    <>
      <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-30 w-full transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-[4.5rem] sm:h-20">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3 group">
                <div className="rounded-xl overflow-hidden bg-white flex items-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.10)] dark:shadow-none">
                  <img
                    src="/logo.jpeg"
                    alt="MeuTerritório"
                    className="h-12 sm:h-12 w-auto object-contain scale-[1.35] sm:scale-[1.15] transition-opacity duration-200 group-hover:opacity-80"
                  />
                </div>
                <span className="text-base sm:text-lg font-extrabold tracking-tight whitespace-nowrap">
                  <span className="text-[#1a3764] dark:text-blue-300">Meu</span><span className="text-[#0097a7] dark:text-teal-300">Território</span>
                </span>
              </Link>

              <div className="hidden md:flex items-center space-x-1">
                <Link
                  to="/dashboard"
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/dashboard')
                      ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Squares2X2Icon className="w-5 h-5 mr-2" />
                  Dashboard
                </Link>

                {(isAdmin || role === 'GESTOR' || user?.cargo === 'Recepcionista') && (
                  <Link
                    to="/notificacoes"
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive('/notificacoes')
                        ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <BellIcon className="w-5 h-5 mr-2" />
                    Notificações
                  </Link>
                )}

                {(isAdmin || role === 'GESTOR' || user?.cargo === 'Recepcionista') && (
                  <Link
                    to="/gerenciar-mensagens"
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive('/gerenciar-mensagens')
                        ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <EnvelopeIcon className="w-5 h-5 mr-2" />
                    Mensagens
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <button
                type="button"
                onClick={onToggleTheme}
                className="group flex items-center text-gray-500 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white transition-all duration-200"
                aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                <div className="p-2 rounded-full group-hover:bg-gray-100 dark:group-hover:bg-slate-800 transition-colors">
                  {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </div>
              </button>

              <div className="hidden sm:flex flex-col items-end border-r border-gray-200 dark:border-slate-700 pr-6 mr-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Bem-vindo, {user.nome}!
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center capitalize">
                  <UserCircleIcon className="w-3 h-3 mr-1" />
                  {user?.cargo ? `${user.cargo}` : `Acesso: ${roleLabel}`}
                </span>
              </div>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold hover:bg-blue-200 transition-colors dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700 focus:outline-none"
                >
                  {userInitial}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-slate-700 z-50">
                    <Link
                      to="/configuracoes"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Cog6ToothIcon className="w-4 h-4 mr-2" />
                      Configurações
                    </Link>

                    {role === 'USER' && (
                      <button
                        onClick={() => { setIsUserMenuOpen(false); setSolicitarModalOpen(true); }}
                        className="w-full flex items-center px-4 py-2 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left"
                      >
                        <ArrowUpCircleIcon className="w-4 h-4 mr-2 shrink-0" />
                        Solicitar acesso profissional
                      </button>
                    )}

                    {(isAdmin || role === 'GESTOR') && (
                      <Link
                        to="/solicitacoes"
                        className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <span className="flex items-center">
                          <ClipboardDocumentCheckIcon className="w-4 h-4 mr-2" />
                          Solicitações
                        </span>
                        {pendingCount > 0 && (
                          <span className="ml-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                            {pendingCount}
                          </span>
                        )}
                      </Link>
                    )}

                    {(isAdmin || role === 'GESTOR') && (
                      <Link
                        to="/gerenciar-cargos"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <BriefcaseIcon className="w-4 h-4 mr-2" />
                        Cargos
                      </Link>
                    )}

                    {(isAdmin || role === 'GESTOR') && (
                      <Link
                        to="/gerenciar-ubs"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <BuildingOffice2Icon className="w-4 h-4 mr-2" />
                        Gerenciar UBS
                      </Link>
                    )}

                    {role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors font-semibold"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <ShieldCheckIcon className="w-4 h-4 mr-2" />
                        Painel Admin
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {solicitarModalOpen && <SolicitarAcessoModal user={user} onClose={() => setSolicitarModalOpen(false)} />}
    </>
  );
};

export default NavBar;
