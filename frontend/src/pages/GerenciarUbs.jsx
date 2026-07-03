import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../components/ui/Notifications';
import { gestorUbsService } from '../services/gestorUbsService';

const EMPTY_FORM = {
  nome_ubs: '',
  cnes: '',
  area_atuacao: '',
  numero_habitantes_ativos: '',
  numero_microareas: '',
  numero_familias_cadastradas: '',
  numero_domicilios: '',
  responsavel_nome: '',
  responsavel_cargo: '',
  responsavel_contato: '',
};

const Field = ({ label, name, value, onChange, type = 'text', required }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-md text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      required={required}
    />
  </div>
);

const GerenciarUbs = () => {
  const { notify } = useNotifications();
  const [ubsList, setUbsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadUbs = async () => {
    setError(null);
    try {
      const data = await gestorUbsService.listAll();
      setUbsList(data || []);
    } catch (err) {
      const msg = err.message || 'Erro ao carregar UBS.';
      setError(msg);
      notify({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUbs(); }, []);

  const handleSetActive = async (ubsId) => {
    setActionId(ubsId);
    try {
      await gestorUbsService.setActive(ubsId);
      notify({ type: 'success', message: 'UBS definida como ativa.' });
      await loadUbs();
    } catch (err) {
      notify({ type: 'error', message: err.message || 'Erro ao definir UBS ativa.' });
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (ubsId) => {
    setActionId(ubsId);
    try {
      await gestorUbsService.remove(ubsId);
      notify({ type: 'success', message: 'UBS removida com sucesso.' });
      setConfirmDelete(null);
      await loadUbs();
    } catch (err) {
      notify({ type: 'error', message: err.message || 'Erro ao remover UBS.' });
    } finally {
      setActionId(null);
    }
  };

  const openEdit = (ubs) => {
    setEditTarget(ubs);
    setEditForm({
      nome_ubs: ubs.nome_ubs ?? '',
      cnes: ubs.cnes ?? '',
      area_atuacao: ubs.area_atuacao ?? '',
      numero_habitantes_ativos: ubs.numero_habitantes_ativos ?? '',
      numero_microareas: ubs.numero_microareas ?? '',
      numero_familias_cadastradas: ubs.numero_familias_cadastradas ?? '',
      numero_domicilios: ubs.numero_domicilios ?? '',
      responsavel_nome: ubs.responsavel_nome ?? '',
      responsavel_cargo: ubs.responsavel_cargo ?? '',
      responsavel_contato: ubs.responsavel_contato ?? '',
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      const payload = {
        nome_ubs: editForm.nome_ubs || undefined,
        cnes: editForm.cnes || undefined,
        area_atuacao: editForm.area_atuacao || undefined,
        numero_habitantes_ativos: editForm.numero_habitantes_ativos !== '' ? Number(editForm.numero_habitantes_ativos) : undefined,
        numero_microareas: editForm.numero_microareas !== '' ? Number(editForm.numero_microareas) : undefined,
        numero_familias_cadastradas: editForm.numero_familias_cadastradas !== '' ? Number(editForm.numero_familias_cadastradas) : undefined,
        numero_domicilios: editForm.numero_domicilios !== '' ? Number(editForm.numero_domicilios) : undefined,
        responsavel_nome: editForm.responsavel_nome || undefined,
        responsavel_cargo: editForm.responsavel_cargo || undefined,
        responsavel_contato: editForm.responsavel_contato || undefined,
      };
      await gestorUbsService.update(editTarget.id, payload);
      notify({ type: 'success', message: 'UBS atualizada com sucesso.' });
      setEditTarget(null);
      await loadUbs();
    } catch (err) {
      notify({ type: 'error', message: err.message || 'Erro ao atualizar UBS.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-panel mb-6 rise-fade">
        <div className="page-panel-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Gerenciar UBS</h1>
            <p className="page-subtitle">
              Visualize, edite, ative ou remova as UBS cadastradas no sistema.
            </p>
          </div>
          <Link
            to="/setup-ubs?mode=new"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg shadow transition-colors text-sm whitespace-nowrap"
          >
            Cadastrar nova UBS
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg overflow-hidden rise-fade stagger-2">
        {loading ? (
          <div className="p-6 text-center text-gray-500 dark:text-slate-400">Carregando...</div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 font-medium mb-3">{error}</p>
            <button
              onClick={() => { setLoading(true); loadUbs(); }}
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Tentar novamente
            </button>
          </div>
        ) : ubsList.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-slate-400">
            Nenhuma UBS cadastrada no sistema.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">CNES</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Área de Atuação</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ativa</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                {ubsList.map((ubs) => (
                  <tr key={ubs.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">
                      {ubs.nome_ubs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                      {ubs.cnes}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300 max-w-xs truncate">
                      {ubs.area_atuacao}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {ubs.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                          Ativa
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        onClick={() => openEdit(ubs)}
                        disabled={actionId === ubs.id}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                      >
                        Editar
                      </button>
                      {!ubs.is_active && (
                        <button
                          onClick={() => handleSetActive(ubs.id)}
                          disabled={actionId === ubs.id}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                        >
                          Definir como ativa
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDelete(ubs.id)}
                        disabled={actionId === ubs.id}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-300 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de edição */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Editar UBS
              </h3>
              <button
                onClick={() => setEditTarget(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSave} className="px-6 py-4 space-y-4">
              <Field label="Nome da UBS" name="nome_ubs" value={editForm.nome_ubs} onChange={handleEditChange} required />
              <Field label="CNES" name="cnes" value={editForm.cnes} onChange={handleEditChange} required />
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Área de Atuação <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="area_atuacao"
                  value={editForm.area_atuacao}
                  onChange={handleEditChange}
                  rows={3}
                  required
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-md text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Habitantes Ativos" name="numero_habitantes_ativos" value={editForm.numero_habitantes_ativos} onChange={handleEditChange} type="number" />
                <Field label="Microáreas" name="numero_microareas" value={editForm.numero_microareas} onChange={handleEditChange} type="number" />
                <Field label="Famílias Cadastradas" name="numero_familias_cadastradas" value={editForm.numero_familias_cadastradas} onChange={handleEditChange} type="number" />
                <Field label="Domicílios" name="numero_domicilios" value={editForm.numero_domicilios} onChange={handleEditChange} type="number" />
              </div>

              <div className="border-t border-gray-100 dark:border-slate-800 pt-3 space-y-3">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Responsável</p>
                <Field label="Nome" name="responsavel_nome" value={editForm.responsavel_nome} onChange={handleEditChange} />
                <Field label="Cargo" name="responsavel_cargo" value={editForm.responsavel_cargo} onChange={handleEditChange} />
                <Field label="Contato" name="responsavel_contato" value={editForm.responsavel_contato} onChange={handleEditChange} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Confirmar remoção
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
              Tem certeza que deseja remover esta UBS? Esta ação não pode ser desfeita facilmente.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={actionId === confirmDelete}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionId === confirmDelete ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciarUbs;
