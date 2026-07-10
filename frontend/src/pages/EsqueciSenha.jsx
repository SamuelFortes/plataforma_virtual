import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { isValidEmail } from '../utils/validators';

const EsqueciSenha = ({ isDark, onToggleTheme }) => {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Informe um e-mail válido.');
      return;
    }

    try {
      setEnviando(true);
      await api.request('/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
      setEnviado(true);
    } catch (err) {
      setError('Não foi possível processar o pedido. Tente novamente em instantes.');
    } finally {
      setEnviando(false);
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
            Recuperar senha
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 px-8 py-8">
          {enviado ? (
            <div className="space-y-5 text-center">
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3">
                <p className="text-sm text-green-700 dark:text-green-400">
                  Se o e-mail estiver cadastrado, enviamos um link para redefinir sua senha.
                  Verifique sua caixa de entrada (e o spam).
                </p>
              </div>
              <Link
                to="/login"
                className="inline-block font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 text-sm"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">
                Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.
              </p>

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

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-semibold py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-60"
                >
                  {enviando ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Lembrou a senha?{' '}
                <Link to="/login" className="font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400">
                  Voltar ao login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EsqueciSenha;
