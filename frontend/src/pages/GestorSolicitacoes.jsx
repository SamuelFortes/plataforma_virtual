import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../components/ui/Notifications';
import { api } from '../services/api';

const STATUS_LABEL = {
  PENDING: { text: 'Pendente', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  APPROVED: { text: 'Aprovado', cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  REJECTED: { text: 'Rejeitado', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
};

const GestorSolicitacoes = () => {
  const { notify, confirm, prompt } = useNotifications();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('PENDING');

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filtro ? `?status_filter=${filtro}` : '';
      const data = await api.request(`/auth/professional-requests${params}`, { requiresAuth: true });
      setSolicitacoes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar solicitações.');
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleApprove = async (sol) => {
    const confirmed = await confirm({
      title: 'Aprovar solicitação',
      message: `Aprovar ${sol.user.nome} como ${sol.cargo}?`,
      confirmLabel: 'Aprovar',
      cancelLabel: 'Cancelar',
    });
    if (!confirmed) return;

    try {
      await api.request(`/auth/professional-requests/${sol.id}/approve`, {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify({ role: 'PROFISSIONAL' }),
      });
      notify({ type: 'success', message: `${sol.user.nome} aprovado como PROFISSIONAL.` });
      carregar();
    } catch (err) {
      notify({ type: 'error', message: err.message || 'Erro ao aprovar solicitação.' });
    }
  };

  const handleReject = async (sol) => {
    const motivo = await prompt({
      title: 'Rejeitar solicitação',
      message: `Informe o motivo da rejeição para ${sol.user.nome}.`,
      placeholder: 'Motivo da rejeição',
      confirmLabel: 'Rejeitar',
      cancelLabel: 'Cancelar',
    });
    if (motivo === null) return;
    if (!motivo.trim()) {
      notify({ type: 'warning', message: 'Informe um motivo para a rejeição.' });
      return;
    }

    try {
      await api.request(`/auth/professional-requests/${sol.id}/reject`, {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify({ rejection_reason: motivo }),
      });
      notify({ type: 'info', message: `Solicitação de ${sol.user.nome} rejeitada.` });
      carregar();
    } catch (err) {
      notify({ type: 'error', message: err.message || 'Erro ao rejeitar solicitação.' });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Solicitações Profissionais</h1>
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', ''].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtro === f
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {f === '' ? 'Todas' : STATUS_LABEL[f]?.text ?? f}
            </button>
          ))}
        </div>
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

      {!loading && !error && solicitacoes.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-slate-400">
          Nenhuma solicitação encontrada.
        </div>
      )}

      {!loading && solicitacoes.length > 0 && (
        <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                {['Usuário', 'Cargo Solicitado', 'Registro', 'Data Envio', 'Status', 'Ações'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {solicitacoes.map((sol) => {
                const st = STATUS_LABEL[sol.status] ?? { text: sol.status, cls: '' };
                return (
                  <tr key={sol.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-5 py-4 text-sm">
                      <p className="font-medium text-gray-900 dark:text-white">{sol.user.nome}</p>
                      <p className="text-gray-500 dark:text-slate-400 text-xs">{sol.user.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 dark:text-slate-300">{sol.cargo}</td>
                    <td className="px-5 py-4 text-xs text-gray-700 dark:text-slate-300 font-mono">{sol.registro_profissional}</td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-slate-400">
                      {new Date(sol.submitted_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>
                        {st.text}
                      </span>
                      {sol.rejection_reason && (
                        <p className="text-xs text-gray-400 mt-1 max-w-[160px]">{sol.rejection_reason}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {sol.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(sol)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleReject(sol)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition"
                          >
                            Rejeitar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GestorSolicitacoes;
