import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, KeyIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../components/ui/Notifications';
import { api } from '../services/api';
import { validatePassword } from '../utils/validators';

const Configuracoes = () => {
  const { notify } = useNotifications();
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  const [form, setForm] = useState({ senha_atual: '', nova_senha: '', confirmar_nova_senha: '' });
  const [show, setShow] = useState({ atual: false, nova: false, confirmar: false });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleShow = (field) => setShow((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const senhaError = validatePassword(form.nova_senha);
    if (senhaError) {
      notify({ type: 'warning', message: senhaError });
      return;
    }

    if (form.nova_senha !== form.confirmar_nova_senha) {
      notify({ type: 'warning', message: 'As senhas não conferem.' });
      return;
    }

    try {
      setSaving(true);
      await api.request('/auth/change-password', {
        method: 'POST',
        requiresAuth: true,
        body: {
          senha_atual: form.senha_atual || null,
          nova_senha: form.nova_senha,
          confirmar_nova_senha: form.confirmar_nova_senha,
        },
      });
      notify({ type: 'success', message: 'Senha alterada com sucesso.' });
      setForm({ senha_atual: '', nova_senha: '', confirmar_nova_senha: '' });
    } catch (error) {
      notify({ type: 'error', message: error.message || 'Erro ao alterar senha.' });
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = { USER: 'Usuário', PROFISSIONAL: 'Profissional', GESTOR: 'Gestor' };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">

      {/* Cabeçalho */}
      <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Gerencie sua conta</p>
      </div>

      {/* Informações da conta */}
      <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <UserCircleIcon className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-700 dark:text-slate-200">Minha conta</h2>
        </div>
        <dl className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-slate-400">Nome</dt>
            <dd className="font-medium text-gray-900 dark:text-white">{user?.nome}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-slate-400">E-mail</dt>
            <dd className="font-medium text-gray-900 dark:text-white">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-slate-400">Perfil</dt>
            <dd className="font-medium text-gray-900 dark:text-white">
              {user?.cargo || roleLabel[user?.role] || user?.role}
            </dd>
          </div>
        </dl>
      </div>

      {/* Alterar senha */}
      <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg p-6">
        <div className="flex items-center gap-3 mb-1">
          <KeyIcon className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-700 dark:text-slate-200">Alterar senha</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-5">
          Se você acessa o sistema apenas via Google e nunca definiu uma senha, deixe o campo
          <strong> "Senha atual"</strong> em branco.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Senha atual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Senha atual
            </label>
            <div className="relative">
              <input
                type={show.atual ? 'text' : 'password'}
                name="senha_atual"
                value={form.senha_atual}
                onChange={handleChange}
                placeholder="Deixe em branco se só usa Google"
                className="block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-10 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => toggleShow('atual')}
                className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
              >
                {show.atual ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Nova senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Nova senha
            </label>
            <div className="relative">
              <input
                type={show.nova ? 'text' : 'password'}
                name="nova_senha"
                value={form.nova_senha}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                required
                className="block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-10 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => toggleShow('nova')}
                className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
              >
                {show.nova ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Mínimo 8 caracteres, com letra maiúscula, minúscula e número.
            </p>
          </div>

          {/* Confirmar nova senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Confirmar nova senha
            </label>
            <div className="relative">
              <input
                type={show.confirmar ? 'text' : 'password'}
                name="confirmar_nova_senha"
                value={form.confirmar_nova_senha}
                onChange={handleChange}
                placeholder="Repita a nova senha"
                required
                className="block w-full rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-10 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => toggleShow('confirmar')}
                className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
              >
                {show.confirmar ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Salvando...' : 'Alterar senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Configuracoes;
