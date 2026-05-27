import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { EyeIcon, EyeSlashIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';

const OAUTH_ERRORS = {
  login_cancelado: 'Login com Google cancelado.',
  falha_google: 'Falha ao autenticar com Google. Tente novamente.',
  conta_inativa: 'Esta conta está desativada.',
  email_nao_fornecido: 'Não foi possível obter o e-mail da conta Google.',
  estado_invalido: 'Erro de segurança no login. Tente novamente.',
  dados_invalidos: 'Erro ao processar dados do login. Tente novamente.',
};

const Login = ({ isDark, onToggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(OAUTH_ERRORS[oauthError] || 'Erro no login com Google.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', { email, senha: password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError('E-mail ou senha incorretos.');
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        onClick={onToggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
        aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      >
        {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      </button>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src="/logo.jpeg"
              alt="MeuTerritório"
              className="h-28 w-auto object-contain scale-[1.35] sm:scale-[1.15] sm:h-28"
            />
          </div>
          <div className="mt-2 flex flex-col items-center leading-tight">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="text-[#1a3764] dark:text-blue-300">Meu</span><span className="text-[#0097a7] dark:text-teal-300">Território</span>
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-px w-5 bg-green-500 shrink-0" />
              <span className="text-[10px] tracking-widest text-gray-400 dark:text-slate-500 uppercase font-medium">
                conectar · conhecer · cuidar
              </span>
              <span className="h-px w-5 bg-[#1a3764] dark:bg-blue-400 shrink-0" />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 tracking-widest uppercase font-medium">
            Acesse sua conta
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 px-8 py-8">
          {error && (
            <div className="mb-5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="email">
                E-mail
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-11 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-semibold py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
            >
              Entrar
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
            <span className="text-xs text-slate-400 whitespace-nowrap">ou continue com</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
          </div>

          <a
            href="/api/auth/google/login"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Entrar com Google
          </a>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Não possui conta?{' '}
            <Link to="/register" className="font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400">
              Cadastre-se aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
