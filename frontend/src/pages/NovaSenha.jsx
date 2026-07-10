import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { validatePassword } from '../utils/validators';

const NovaSenha = ({ isDark, onToggleTheme }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Link inválido. Solicite uma nova recuperação de senha.');
      return;
    }

    const senhaError = validatePassword(senha);
    if (senhaError) {
      setError(senhaError);
      return;
    }

    if (senha !== confirmar) {
      setError('As senhas não conferem.');
      return;
    }

    try {
      setSalvando(true);
      await api.request('/auth/reset-password-token', {
        method: 'POST',
        body: { token, nova_senha: senha, confirmar_nova_senha: confirmar },
      });
      navigate('/login?reset=ok');
    } catch (err) {
      setError(err.message?.includes('inválido') || err.message?.includes('expirado')
        ? 'Link inválido ou expirado. Solicite uma nova recuperação de senha.'
        : (err.message || 'Não foi possível redefinir a senha. Tente novamente.'));
    } finally {
      setSalvando(false);
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
          <p className="text-sm text-slate-500 dark:text-slate-400 tracking-widest uppercase font-medium">
            Criar nova senha
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 px-8 py-8">
          {!token && (
            <div className="mb-5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Link sem token. Solicite uma nova recuperação de senha.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="senha">
                Nova senha
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-11 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                  id="senha"
                  type={showSenha ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  onClick={() => setShowSenha(!showSenha)}
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showSenha ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Mínimo 8 caracteres, com maiúscula, minúscula e número.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="confirmar">
                Confirmar nova senha
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-11 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                  id="confirmar"
                  type={showConfirmar ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  onClick={() => setShowConfirmar(!showConfirmar)}
                  aria-label={showConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showConfirmar ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={salvando || !token}
              className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-semibold py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <Link to="/login" className="font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400">
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NovaSenha;
