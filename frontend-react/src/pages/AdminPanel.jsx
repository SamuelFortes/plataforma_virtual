import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../components/ui/Notifications';
import { api } from '../services/api';

const ROLE_OPTIONS = ['USER', 'PROFISSIONAL', 'GESTOR', 'ADMIN'];

const ROLE_BADGE = {
  USER:         'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300',
  PROFISSIONAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  GESTOR:       'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  ADMIN:        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const AdminPanel = () => {
  const { notify, confirm } = useNotifications();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [changing, setChanging] = useState(null);
  const [busca, setBusca] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.request('/auth/admin/users', { requiresAuth: true });
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleSetRole = async (usuario, novoRole) => {
    if (usuario.role === novoRole) return;

    const confirmed = await confirm({
      title: 'Alterar permissão',
      message: `Alterar ${usuario.nome} de ${usuario.role} para ${novoRole}?`,
      confirmLabel: 'Confirmar',
      cancelLabel: 'Cancelar',
    });
    if (!confirmed) return;

    setChanging(usuario.id);
    try {
      await api.request(`/auth/admin/users/${usuario.id}/set-role`, {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify({ role: novoRole }),
      });
      notify({ type: 'success', message: `${usuario.nome} agora é ${novoRole}.` });
      setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, role: novoRole } : u));
    } catch (err) {
      notify({ type: 'error', message: err.message || 'Erro ao alterar permissão.' });
    } finally {
      setChanging(null);
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Painel Administrativo</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Gerencie os níveis de acesso de todos os usuários da plataforma.
        </p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 mb-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                {['Usuário', 'Cargo', 'Permissão atual', 'Alterar para', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400 dark:text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-5 py-4 text-sm">
                      <p className="font-medium text-gray-900 dark:text-white">{u.nome}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-slate-400">
                      {u.cargo || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[u.role] ?? ''}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {ROLE_OPTIONS.filter(r => r !== u.role).map(r => (
                          <button
                            key={r}
                            disabled={changing === u.id}
                            onClick={() => handleSetRole(u, r)}
                            className={`px-2 py-1 rounded text-xs font-semibold border transition ${
                              changing === u.id
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:opacity-80 cursor-pointer'
                            } ${ROLE_BADGE[r] ?? 'bg-gray-100 text-gray-700'} border-current`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        u.ativo
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
