import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { EyeIcon, EyeSlashIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../components/ui/Notifications';
import { isValidCpf, isValidEmail, validateName, validatePassword } from '../utils/validators';

const Register = ({ isDark, onToggleTheme }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { notify } = useNotifications();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const nomeError = validateName(formData.nome);
    if (nomeError) {
      setError(nomeError);
      return false;
    }

    if (!isValidEmail(formData.email)) {
      setError('Informe um email valido.');
      return false;
    }

    if (!isValidCpf(formData.cpf)) {
      setError('Informe um CPF valido.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return false;
    }
    const senhaError = validatePassword(formData.password);
    if (senhaError) {
      setError(senhaError);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await axios.post('/api/auth/register', {
        nome: formData.nome,
        email: formData.email,
        senha: formData.password,
        cpf: formData.cpf,
      });
      notify({ type: 'success', message: 'Cadastro realizado com sucesso. Faça login.' });
      navigate('/login');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          const messages = detail.map(e => {
            const field = e.loc[e.loc.length - 1];
            return `${field}: ${e.msg}`;
          }).join('. ');
          setError(messages);
        } else if (typeof detail === 'string') {
          setError(detail);
        } else {
          setError('Erro desconhecido no servidor.');
        }
      } else {
        setError('Erro ao criar conta. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
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
            Crie sua conta
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 px-8 py-8">
          {error && (
            <div className="mb-5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="nome" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome Completo
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                required
                value={formData.nome}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Use apenas letras e espaços.</p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Informe um email valido.</p>
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                CPF (apenas números)
              </label>
              <input
                id="cpf"
                name="cpf"
                type="text"
                required
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">CPF valido (somente numeros ou com pontuacao).</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-11 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Minimo 8 caracteres, com letra maiuscula, minuscula e numero.</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-11 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Repita exatamente a mesma senha.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#0097a7] hover:bg-[#00838f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-semibold text-cyan-600 hover:text-cyan-500">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
