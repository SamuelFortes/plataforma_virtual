import { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BellIcon, 
  ArrowRightOnRectangleIcon, 
  Squares2X2Icon,
  UserCircleIcon,
  BookOpenIcon,
  CalendarIcon,
  MoonIcon,
  SunIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  LifebuoyIcon,
  EnvelopeIcon,
  KeyIcon,
  Cog6ToothIcon,
  BriefcaseIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { ubsService } from '../services/ubsService';

const NavBar = ({ isDark, onToggleTheme }) => {
  const location = useLocation();
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const [hasUbs, setHasUbs] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const isActive = (path) => location.pathname === path;
  const role = (user?.role || 'USER').toUpperCase();
  const roleLabel = role.toLowerCase();
  const canSetupUbs = ['PROFISSIONAL', 'GESTOR'].includes(role);

  useEffect(() => {
    let active = true;
    const loadUbs = async () => {
      if (!canSetupUbs) return;
      try {
        const data = await ubsService.getSingleUbs();
        if (active) setHasUbs(Boolean(data));
      } catch (error) {
        if (active) setHasUbs(false);
      }
    };

    loadUbs();
    return () => { active = false; };
  }, [canSetupUbs]);

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
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-30 w-full transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2 group">
              <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-slate-300">
                Plataforma UBS
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

              {(role === 'GESTOR' || user?.cargo === 'Recepcionista') && (
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

              {(role === 'GESTOR' || user?.cargo === 'Recepcionista') && (
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
                {isDark ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
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
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-slate-700 z-50">
                  <Link
                    to="/redefinir-senha"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Cog6ToothIcon className="w-4 h-4 mr-2" />
                    Configurações
                  </Link>
                  {role === 'GESTOR' && (
                    <Link
                      to="/gerenciar-cargos"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <BriefcaseIcon className="w-4 h-4 mr-2" />
                      Cargos
                    </Link>
                  )}
                  {role === 'GESTOR' && (
                    <Link
                      to="/gerenciar-ubs"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <BuildingOffice2Icon className="w-4 h-4 mr-2" />
                      Gerenciar UBS
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
  );
};

export default NavBar;