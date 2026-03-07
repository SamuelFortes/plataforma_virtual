import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNotifications } from '../components/ui/Notifications';
import { gestaoEquipesService } from '../services/gestaoEquipesService';
import { api } from '../services/api';
import { ubsService } from '../services/ubsService';
import {
  UsersIcon,
  HomeModernIcon,
  MapIcon,
  ChartBarIcon,
  UserCircleIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

// ─── Dados mockados (fallback caso a API não responda) ─────────────
const MOCK_KPIS = {
  populacao_adscrita: 12450,
  familias_cadastradas: 3280,
  microareas_descobertas: 2,
  cobertura_esf: 85,
};

const MOCK_AGENTES = [
  { id: 1, nome: 'Maria Jose da Silva', microarea_nome: 'Microárea 01 - Baixa do Aragão' },
  { id: 2, nome: 'Francisco Alves de Sousa', microarea_nome: 'Microárea 02 - Centro' },
  { id: 3, nome: 'Ana Claudia Ferreira', microarea_nome: 'Microárea 03 - Piauí' },
  { id: 4, nome: 'Jose Ribamar Costa', microarea_nome: 'Microárea 04 - Frei Higino' },
  { id: 5, nome: 'Francisca das Chagas Lima', microarea_nome: 'Microárea 05 - Pindorama' },
];

const EMPTY_MICROAREA_FORM = {
  nome: '',
  localidades: [],
  descricao: '',
  observacoes: '',
  status: 'COBERTA',
  populacao: '',
  familias: '',
};

const isValidId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const normalizeLocalidade = (value) => value.trim().replace(/\s+/g, ' ');

const Modal = ({ open, title, children, onClose, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="relative border-b border-slate-100 px-5 py-4 flex items-center">
          <h3 className="text-base font-semibold text-slate-900 text-center w-full">{title}</h3>
          <button
            onClick={onClose}
            className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="px-5 pb-5">{footer}</div>}
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="text-xs font-semibold text-slate-600">{label}</span>
    <div className="mt-2">{children}</div>
  </label>
);

// ─── Componente KPI Card ────────────────────────────────────────────
const KpiCard = ({ icon: Icon, value, label, color }) => (
  <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg p-5 flex items-center gap-4 border border-gray-100 dark:border-slate-800">
    <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-slate-400">{label}</p>
    </div>
  </div>
);

// ─── Componente Principal ───────────────────────────────────────────
const GestaoEquipesMicroareas = () => {
  const { notify, confirm } = useNotifications();
  const currentUser = api.getCurrentUser();
  const canEdit = useMemo(() => {
    const role = (currentUser?.role || 'USER').toUpperCase();
    return ['GESTOR', 'RECEPCAO'].includes(role);
  }, [currentUser]);

  const [kpis, setKpis] = useState(MOCK_KPIS);
  const [agentes, setAgentes] = useState(MOCK_AGENTES);
  const [microareas, setMicroareas] = useState([]);
  const [acsUsers, setAcsUsers] = useState([]);
  const [selectedUbsId, setSelectedUbsId] = useState('');
  const [ubsInfo, setUbsInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  const [microareaModalOpen, setMicroareaModalOpen] = useState(false);
  const [microareaModalMode, setMicroareaModalMode] = useState('create');
  const [microareaForm, setMicroareaForm] = useState(EMPTY_MICROAREA_FORM);
  const [localidadeInput, setLocalidadeInput] = useState('');
  const [microareaEditingId, setMicroareaEditingId] = useState(null);
  const [savingMicroarea, setSavingMicroarea] = useState(false);
  const [microareaAgentsModalOpen, setMicroareaAgentsModalOpen] = useState(false);
  const [microareaAgentsTarget, setMicroareaAgentsTarget] = useState(null);
  const [selectedUsuarioIds, setSelectedUsuarioIds] = useState([]);
  const [microareaDetailsOpen, setMicroareaDetailsOpen] = useState(false);
  const [microareaDetailsTarget, setMicroareaDetailsTarget] = useState(null);

  const loadCatalogs = useCallback(async () => {
    try {
      const [ubsData, acsData] = await Promise.all([
        ubsService.getSingleUbs(),
        gestaoEquipesService.getAcsUsers(),
      ]);
      setAcsUsers(Array.isArray(acsData) ? acsData : []);
      setUbsInfo(ubsData);
      setSelectedUbsId(ubsData ? String(ubsData.id) : '');
    } catch (error) {
      notify({ type: 'warning', message: error.message || 'Não foi possível carregar a UBS.' });
    }
  }, [notify]);

  const loadData = useCallback(async () => {
    if (!selectedUbsId) return;
    setLoading(true);
    setUsingMockData(false);
    try {
      const [kpisData, agentesData, microareasData] = await Promise.all([
        gestaoEquipesService.getKpis({ ubs_id: selectedUbsId }),
        gestaoEquipesService.getAgentes({ ubs_id: selectedUbsId }),
        gestaoEquipesService.getMicroareas({ ubs_id: selectedUbsId }),
      ]);
      setKpis(kpisData || MOCK_KPIS);
      setAgentes(Array.isArray(agentesData) && agentesData.length > 0 ? agentesData : []);
      setMicroareas(Array.isArray(microareasData) ? microareasData : []);
    } catch {
      setKpis(MOCK_KPIS);
      setAgentes(MOCK_AGENTES);
      setMicroareas([]);
      setUsingMockData(true);
      notify({ type: 'warning', message: 'Usando dados de demonstração. Conexão com o servidor indisponível.' });
    } finally {
      setLoading(false);
    }
  }, [notify, selectedUbsId]);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const microareaAgentIds = useMemo(() => {
    const map = new Map();
    agentes.forEach((agente) => {
      if (!agente.microarea_id || !agente.usuario_id) return;
      const list = map.get(agente.microarea_id) || [];
      list.push(Number(agente.usuario_id));
      map.set(agente.microarea_id, list);
    });
    return map;
  }, [agentes]);
  const microareasCobertas = useMemo(
    () => microareas.filter((microarea) => microarea.status === 'COBERTA').length,
    [microareas]
  );

  const renderLocalidades = (localidades) => {
    if (!Array.isArray(localidades) || localidades.length === 0) {
      return <span className="text-xs text-slate-400">Sem localidades informadas</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {localidades.map((local) => (
          <span
            key={local}
            className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
          >
            {local}
          </span>
        ))}
      </div>
    );
  };

  const openNewMicroarea = () => {
    setMicroareaForm(EMPTY_MICROAREA_FORM);
    setLocalidadeInput('');
    setMicroareaModalMode('create');
    setMicroareaEditingId(null);
    setMicroareaModalOpen(true);
  };

  const openEditMicroarea = (microarea) => {
    setMicroareaForm({
      nome: microarea.nome ?? '',
      localidades: Array.isArray(microarea.localidades) ? microarea.localidades : [],
      descricao: microarea.descricao ?? '',
      observacoes: microarea.observacoes ?? '',
      status: microarea.status ?? 'COBERTA',
      populacao: microarea.populacao ?? 0,
      familias: microarea.familias ?? 0,
    });
    setLocalidadeInput('');
    setMicroareaModalMode('edit');
    setMicroareaEditingId(microarea.id);
    setMicroareaModalOpen(true);
  };

  const handleAddLocalidade = () => {
    const cleaned = normalizeLocalidade(localidadeInput);
    if (!cleaned) return;

    setMicroareaForm((prev) => {
      const exists = prev.localidades.some(
        (item) => normalizeLocalidade(item).toLowerCase() === cleaned.toLowerCase()
      );
      if (exists) return prev;
      return { ...prev, localidades: [...prev.localidades, cleaned] };
    });
    setLocalidadeInput('');
  };

  const handleRemoveLocalidade = (value) => {
    setMicroareaForm((prev) => ({
      ...prev,
      localidades: prev.localidades.filter((item) => item !== value),
    }));
  };

  const openAssociateAgents = (microarea) => {
    const currentIds = microareaAgentIds.get(microarea.id) || [];
    setMicroareaAgentsTarget(microarea);
    setSelectedUsuarioIds([...new Set(currentIds)]);
    setMicroareaAgentsModalOpen(true);
  };

  const openMicroareaDetails = (microarea) => {
    setMicroareaDetailsTarget(microarea);
    setMicroareaDetailsOpen(true);
  };

  const getAgentsForMicroarea = (microareaId) => (
    agentes
      .filter((agente) => agente.microarea_id === microareaId)
      .map((agente) => agente.nome)
      .filter(Boolean)
  );


  const buildMicroareaPayload = () => {
    const payload = {
      nome: microareaForm.nome.trim(),
      localidades: microareaForm.localidades,
      descricao: microareaForm.descricao.trim(),
      observacoes: microareaForm.observacoes?.trim() || null,
      status: microareaForm.status,
      populacao: Number(microareaForm.populacao || 0),
      familias: Number(microareaForm.familias || 0),
    };

    if (microareaModalMode === 'create') {
      payload.ubs_id = Number(selectedUbsId);
    }

    return payload;
  };

  const handleSaveMicroarea = async () => {
    if (!canEdit || usingMockData) {
      notify({ type: 'warning', message: 'Edição indisponível para este usuário ou em modo de demonstração.' });
      return;
    }

    if (!isValidId(selectedUbsId)) {
      notify({ type: 'error', message: 'Selecione uma UBS válida.' });
      return;
    }

    if (!microareaForm.nome.trim()) {
      notify({ type: 'error', message: 'O nome da microárea é obrigatório.' });
      return;
    }

    if (microareaForm.localidades.length === 0) {
      notify({ type: 'error', message: 'Inclua ao menos uma localidade.' });
      return;
    }

    if (!microareaForm.descricao.trim()) {
      notify({ type: 'error', message: 'A descrição da microárea é obrigatória.' });
      return;
    }

    try {
      setSavingMicroarea(true);
      const payload = buildMicroareaPayload();

      if (microareaModalMode === 'create') {
        await gestaoEquipesService.createMicroarea(payload);
        notify({ type: 'success', message: 'Microárea criada com sucesso.' });
      } else if (microareaEditingId) {
        await gestaoEquipesService.updateMicroarea(microareaEditingId, payload);
        notify({ type: 'success', message: 'Microárea atualizada com sucesso.' });
      }

      setMicroareaModalOpen(false);
      await loadData();
    } catch (error) {
      notify({ type: 'error', message: error.message || 'Erro ao salvar microárea.' });
    } finally {
      setSavingMicroarea(false);
    }
  };


  const handleDeleteAgente = async (agente) => {
    if (!canEdit || usingMockData) {
      notify({ type: 'warning', message: 'Edição indisponível para este usuário ou em modo de demonstração.' });
      return;
    }

    const confirmed = await confirm({
      title: 'Desassociar agente',
      message: `Deseja desassociar ${agente.nome || 'este agente'} da microárea?`,
      confirmLabel: 'Desassociar',
      cancelLabel: 'Cancelar',
    });
    if (!confirmed) return;

    try {
      await gestaoEquipesService.deleteAgente(agente.id);
      notify({ type: 'success', message: 'Agente desassociado com sucesso.' });
      await loadData();
    } catch (error) {
      notify({ type: 'error', message: error.message || 'Erro ao desassociar agente.' });
    }
  };

  const handleDeleteMicroarea = async (microarea) => {
    if (!canEdit || usingMockData) {
      notify({ type: 'warning', message: 'Edição indisponível para este usuário ou em modo de demonstração.' });
      return;
    }

    const confirmed = await confirm({
      title: 'Descadastrar microárea',
      message: `Deseja descadastrar a microárea ${microarea.nome}? Os vínculos com agentes serão removidos.`,
      confirmLabel: 'Descadastrar',
      cancelLabel: 'Cancelar',
    });
    if (!confirmed) return;

    try {
      await gestaoEquipesService.deleteMicroarea(microarea.id);
      notify({ type: 'success', message: 'Microárea descadastrada com sucesso.' });
      await loadData();
    } catch (error) {
      notify({ type: 'error', message: error.message || 'Erro ao descadastrar microárea.' });
    }
  };

  const handleExportMicroareas = async () => {
    if (!selectedUbsId) {
      notify({ type: 'warning', message: 'Selecione uma UBS valida para exportar.' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/gestao-equipes/microareas/export/pdf?ubs_id=${selectedUbsId}`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
      );

      const disposition = response.headers?.['content-disposition'] || '';
      let filename = 'relatorio_microareas.pdf';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      if (match && match[1]) filename = match[1];

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      notify({ type: 'error', message: error.message || 'Erro ao exportar o PDF.' });
    }
  };

  const handleToggleUsuarioId = (usuarioId) => {
    setSelectedUsuarioIds((prev) =>
      prev.includes(usuarioId) ? prev.filter((id) => id !== usuarioId) : [...prev, usuarioId]
    );
  };

  const handleAssociateAgents = async () => {
    if (!canEdit || usingMockData) {
      notify({ type: 'warning', message: 'Edição indisponível para este usuário ou em modo de demonstração.' });
      return;
    }

    if (!microareaAgentsTarget?.id) {
      notify({ type: 'error', message: 'Selecione uma microárea válida.' });
      return;
    }

    if (selectedUsuarioIds.length === 0) {
      notify({ type: 'warning', message: 'Selecione ao menos um ACS.' });
      return;
    }

    try {
      await gestaoEquipesService.associateAgentes(microareaAgentsTarget.id, selectedUsuarioIds);
      notify({ type: 'success', message: 'Agentes vinculados com sucesso.' });
      setMicroareaAgentsModalOpen(false);
      await loadData();
    } catch (error) {
      notify({ type: 'error', message: error.message || 'Erro ao vincular agentes.' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rise-fade flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Gerenciar agentes e microáreas
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Edite microáreas e agentes. Os indicadores são calculados automaticamente.
          </p>
          {ubsInfo && (
            <p className="mt-3 text-sm text-gray-600 dark:text-slate-300">
              UBS: <strong>{ubsInfo.nome_ubs}</strong>
            </p>
          )}
        </div>
        {canEdit && !usingMockData && (
          <button
            onClick={handleExportMicroareas}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            Exportar relatorio PDF
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      )}

      {!loading && !selectedUbsId && (
        <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg p-6">
          <p className="text-gray-600 dark:text-slate-300">
            Nenhuma UBS configurada. Finalize a configuração inicial para continuar.
          </p>
        </div>
      )}

      {!loading && selectedUbsId && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 rise-fade stagger-1">
            <KpiCard
              icon={UsersIcon}
              value={(kpis.populacao_adscrita || 0).toLocaleString('pt-BR')}
              label="População Adscrita"
              color="bg-blue-600"
            />
            <KpiCard
              icon={HomeModernIcon}
              value={(kpis.familias_cadastradas || 0).toLocaleString('pt-BR')}
              label="Famílias Cadastradas"
              color="bg-emerald-600"
            />
            <KpiCard
              icon={MapIcon}
              value={kpis.microareas_descobertas || 0}
              label="Microáreas Descobertas"
              color="bg-amber-500"
            />
            <KpiCard
              icon={CheckCircleIcon}
              value={microareasCobertas}
              label="Microáreas Cobertas"
              color="bg-emerald-600"
            />
            <KpiCard
              icon={ChartBarIcon}
              value={`${kpis.cobertura_esf || 0}%`}
              label="Cobertura ESF"
              color="bg-violet-600"
            />
          </section>

          <section className="mb-8 rise-fade stagger-2">
            <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <UserCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Agentes Comunitários de Saúde
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        {agentes.length} agentes
                      </p>
                    </div>
                  </div>
                  {canEdit && !usingMockData && (
                    <span className="text-xs text-slate-500">Use “Vincular agentes” nas microáreas.</span>
                  )}
                </div>
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Agente de Saúde
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Microárea
                      </th>
                      {canEdit && !usingMockData && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Ações
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {agentes.map((agente) => (
                      <tr key={agente.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                {(agente.nome || '').split(' ').map((n) => n[0]).slice(0, 2).join('')}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {agente.nome}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                          {agente.microarea_nome || agente.microarea}
                        </td>
                        {canEdit && !usingMockData && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleDeleteAgente(agente)}
                                className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Desassociar
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden p-4 space-y-3">
                {agentes.map((agente) => (
                  <div
                    key={agente.id}
                    className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          {(agente.nome || '').split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {agente.nome}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {agente.microarea_nome || agente.microarea}
                    </p>
                    {canEdit && !usingMockData && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteAgente(agente)}
                          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Desassociar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-8 rise-fade stagger-2">
            <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Microáreas</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      {microareas.length} microáreas cadastradas
                    </p>
                  </div>
                  {canEdit && !usingMockData && (
                    <button
                      onClick={openNewMicroarea}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700"
                    >
                      Nova microárea
                    </button>
                  )}
                </div>
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Microárea
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Famílias
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        População
                      </th>
                      {canEdit && !usingMockData && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Ações
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {microareas.map((microarea) => (
                      <tr key={microarea.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {microarea.nome}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                          {microarea.status}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600 dark:text-slate-300">
                          {microarea.familias}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600 dark:text-slate-300">
                          {microarea.populacao}
                        </td>
                        {canEdit && !usingMockData && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openMicroareaDetails(microarea)}
                                className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                              >
                                Visualizar microárea
                              </button>
                              <button
                                onClick={() => openEditMicroarea(microarea)}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                Editar microárea
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden p-4 space-y-3">
                {microareas.map((microarea) => (
                  <div
                    key={microarea.id}
                    className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {microarea.nome}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-slate-400">{microarea.status}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500 dark:text-slate-400">
                      <span>{microarea.familias} famílias</span>
                      <span>{microarea.populacao} pessoas</span>
                    </div>
                    {canEdit && !usingMockData && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openMicroareaDetails(microarea)}
                          className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                        >
                          Visualizar microárea
                        </button>
                        <button
                          onClick={() => openEditMicroarea(microarea)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Editar microárea
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

        </>
      )}

      <Modal
        open={microareaAgentsModalOpen}
        title={microareaAgentsTarget ? `Vincular agentes - ${microareaAgentsTarget.nome}` : 'Vincular agentes'}
        onClose={() => setMicroareaAgentsModalOpen(false)}
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setMicroareaAgentsModalOpen(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleAssociateAgents}
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
            >
              Vincular
            </button>
          </div>
        )}
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Selecione um ou mais ACS para vincular a microárea.
          </p>
          <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 p-3 space-y-2">
            {acsUsers.length === 0 && (
              <p className="text-sm text-slate-500">Nenhum ACS disponível.</p>
            )}
            {acsUsers.map((user) => (
              <label key={user.id} className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedUsuarioIds.includes(user.id)}
                  onChange={() => handleToggleUsuarioId(user.id)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  {user.nome}
                  <span className="text-xs text-slate-400"> ({user.email})</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        open={microareaDetailsOpen}
        title={microareaDetailsTarget ? `Detalhes - ${microareaDetailsTarget.nome}` : 'Detalhes da microárea'}
        onClose={() => setMicroareaDetailsOpen(false)}
        footer={(
          <div className="flex items-center justify-end gap-2">
            {canEdit && !usingMockData && microareaDetailsTarget && (
              <button
                onClick={() => {
                  setMicroareaDetailsOpen(false);
                  openAssociateAgents(microareaDetailsTarget);
                }}
                className="rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
              >
                Vincular agentes
              </button>
            )}
            <button
              onClick={() => setMicroareaDetailsOpen(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Fechar
            </button>
          </div>
        )}
      >
        {microareaDetailsTarget && (
          <div className="space-y-4 text-sm text-slate-700">
            <div>
              <p className="text-xs font-semibold text-slate-500">Agentes vinculados</p>
              {getAgentsForMicroarea(microareaDetailsTarget.id).length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Nenhum agente vinculado.</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {getAgentsForMicroarea(microareaDetailsTarget.id).map((nome) => (
                    <span
                      key={nome}
                      className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                    >
                      {nome}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Localidades</p>
              <div className="mt-2">{renderLocalidades(microareaDetailsTarget.localidades)}</div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Descrição</p>
              <p className="mt-2 text-sm text-slate-700">
                {microareaDetailsTarget.descricao || 'Sem descrição'}
              </p>
            </div>
            {microareaDetailsTarget.observacoes && (
              <div>
                <p className="text-xs font-semibold text-slate-500">Observações</p>
                <p className="mt-2 text-sm text-slate-700">{microareaDetailsTarget.observacoes}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-[11px] uppercase text-slate-400">Famílias</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {microareaDetailsTarget.familias}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-[11px] uppercase text-slate-400">População</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {microareaDetailsTarget.populacao}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={microareaModalOpen}
        title={microareaModalMode === 'create' ? 'Nova microárea' : 'Editar microárea'}
        onClose={() => setMicroareaModalOpen(false)}
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setMicroareaModalOpen(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveMicroarea}
              disabled={savingMicroarea}
              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
            >
              {savingMicroarea ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome">
            <input
              type="text"
              value={microareaForm.nome}
              onChange={(event) => setMicroareaForm((prev) => ({ ...prev, nome: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              placeholder="Microárea 01 - Centro"
            />
          </Field>
          <Field label="Status">
            <select
              value={microareaForm.status}
              onChange={(event) => setMicroareaForm((prev) => ({ ...prev, status: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="COBERTA">COBERTA</option>
              <option value="DESCOBERTA">DESCOBERTA</option>
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Localidades (ruas, bairros, avenidas)">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={localidadeInput}
                    onChange={(event) => setLocalidadeInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddLocalidade();
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="Digite e pressione Enter"
                  />
                  <button
                    type="button"
                    onClick={handleAddLocalidade}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {microareaForm.localidades.length === 0 && (
                    <span className="text-xs text-slate-400">Nenhuma localidade adicionada.</span>
                  )}
                  {microareaForm.localidades.map((local) => (
                    <span
                      key={local}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      {local}
                      <button
                        type="button"
                        onClick={() => handleRemoveLocalidade(local)}
                        className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-200"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Use termos simples para facilitar a visualização: bairro, rua, avenida.
                </p>
              </div>
            </Field>
          </div>
          <Field label="População">
            <input
              type="number"
              value={microareaForm.populacao}
              onChange={(event) => setMicroareaForm((prev) => ({ ...prev, populacao: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              placeholder="Ex.: 2100"
            />
          </Field>
          <Field label="Famílias">
            <input
              type="number"
              value={microareaForm.familias}
              onChange={(event) => setMicroareaForm((prev) => ({ ...prev, familias: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              placeholder="Ex.: 210"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Descrição (obrigatória)">
              <textarea
                value={microareaForm.descricao}
                onChange={(event) => setMicroareaForm((prev) => ({ ...prev, descricao: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                rows={3}
                placeholder="Delimite a área: do posto X até a avenida Y, incluindo a praça Z."
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Observações (opcional)">
              <textarea
                value={microareaForm.observacoes}
                onChange={(event) => setMicroareaForm((prev) => ({ ...prev, observacoes: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                rows={2}
                placeholder="Ex.: área com alta rotatividade, acesso difícil em dias de chuva."
              />
            </Field>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default GestaoEquipesMicroareas;
