import { useEffect, useMemo, useState } from 'react';
import {
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  FireIcon,
  CheckCircleIcon,
  ClockIcon,
  PlayCircleIcon,
  LightBulbIcon,
  FlagIcon,
  UserIcon,
  CalendarDaysIcon,
  ChatBubbleLeftIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { api } from '../services/api';
import { ubsService } from '../services/ubsService';
import { useNotifications } from '../components/ui/Notifications';

/* ─── constantes ─── */
const GUT_OPTIONS = [1, 2, 3, 4, 5];

const GUT_LABELS = {
  1: 'Muito baixo',
  2: 'Baixo',
  3: 'Médio',
  4: 'Alto',
  5: 'Muito alto',
};

const GUT_COLORS = {
  1: 'bg-emerald-500',
  2: 'bg-emerald-400',
  3: 'bg-amber-400',
  4: 'bg-orange-500',
  5: 'bg-red-500',
};

const STATUS_OPTIONS = [
  {
    value: 'PLANEJADO',
    label: 'Planejado',
    icon: ClockIcon,
    tone: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  {
    value: 'EM_ANDAMENTO',
    label: 'Em andamento',
    icon: PlayCircleIcon,
    tone: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
    dot: 'bg-amber-400',
  },
  {
    value: 'CONCLUIDO',
    label: 'Concluído',
    icon: CheckCircleIcon,
    tone: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
];

const gutScore = (g, u, t) => Number(g || 0) * Number(u || 0) * Number(t || 0);

const scoreTone = (score) => {
  if (score >= 80) return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
  if (score >= 40) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300';
  return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
};

const scoreLevel = (score) => {
  if (score >= 80) return { label: 'Crítico', color: 'text-red-600 dark:text-red-400' };
  if (score >= 40) return { label: 'Atenção', color: 'text-amber-600 dark:text-amber-400' };
  return { label: 'Estável', color: 'text-emerald-600 dark:text-emerald-400' };
};

const emptyProblemForm = {
  titulo: '',
  descricao: '',
  gut_gravidade: 1,
  gut_urgencia: 1,
  gut_tendencia: 1,
  is_prioritario: false,
};

const emptyInterventionForm = {
  objetivo: '',
  metas: '',
  responsavel: '',
  status: 'PLANEJADO',
};

const emptyActionForm = {
  acao: '',
  prazo: '',
  status: 'PLANEJADO',
  observacoes: '',
};

/* ─── componentes auxiliares ─── */

const inputClass =
  'w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const selectClass =
  'w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const btnPrimary =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const btnSecondary =
  'inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors';

const btnDanger =
  'inline-flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 transition-colors';

const cardClass =
  'rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-colors';

const GutSelector = ({ label, icon: Icon, value, onChange }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </div>
    <div className="flex gap-1.5">
      {GUT_OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold transition-all ${
            opt === value
              ? `${GUT_COLORS[opt]} text-white shadow-md scale-110`
              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
          title={GUT_LABELS[opt]}
        >
          {opt}
        </button>
      ))}
    </div>
    <p className="text-[11px] text-slate-400 dark:text-slate-500">{GUT_LABELS[value]}</p>
  </div>
);

const ScoreBadge = ({ score, size = 'md' }) => {
  const level = scoreLevel(score);
  const sizes = {
    sm: 'text-sm px-2.5 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-xl px-5 py-3',
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`rounded-full font-bold ${scoreTone(score)} ${sizes[size]}`}>
        {score}
      </span>
      <span className={`text-[11px] font-medium ${level.color}`}>{level.label}</span>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  const Icon = opt.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${opt.tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {opt.label}
    </span>
  );
};

const SectionHeader = ({ icon: Icon, title, subtitle, iconColor = 'text-blue-600 dark:text-blue-400' }) => (
  <div className="flex items-start gap-3 mb-5">
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ${iconColor}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, message }) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-10 px-6 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
      <Icon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
    </div>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{message}</p>
  </div>
);

const GutInfoPanel = () => (
  <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 p-4">
    <div className="flex items-start gap-2.5">
      <InformationCircleIcon className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
      <div className="space-y-1.5 text-xs text-blue-700 dark:text-blue-300">
        <p className="font-semibold">Matriz GUT - Como funciona?</p>
        <p>Avalie cada problema em 3 dimensões (1 a 5):</p>
        <div className="space-y-1 ml-1">
          <p><strong>G</strong> - Gravidade: qual o impacto se nada for feito?</p>
          <p><strong>U</strong> - Urgência: isso precisa ser resolvido agora?</p>
          <p><strong>T</strong> - Tendência: vai piorar com o tempo?</p>
        </div>
        <p className="pt-1">Score = G x U x T (de 1 a 125). Quanto maior, mais prioritário.</p>
      </div>
    </div>
  </div>
);

/* ─── componente principal ─── */

const MapaProblemasIntervencoes = () => {
  const { notify, confirm } = useNotifications();
  const [ubsInfo, setUbsInfo] = useState(null);
  const [ubsId, setUbsId] = useState('');
  const [problems, setProblems] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [selectedInterventionId, setSelectedInterventionId] = useState(null);
  const [actions, setActions] = useState([]);

  const [problemForm, setProblemForm] = useState(emptyProblemForm);
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [problemEditForm, setProblemEditForm] = useState(null);
  const [interventionForm, setInterventionForm] = useState(emptyInterventionForm);
  const [showInterventionForm, setShowInterventionForm] = useState(false);
  const [interventionEditForm, setInterventionEditForm] = useState(null);
  const [actionForm, setActionForm] = useState(emptyActionForm);
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionEditForm, setActionEditForm] = useState(null);

  const selectedProblem = useMemo(
    () => problems.find((item) => item.id === selectedProblemId) || null,
    [problems, selectedProblemId]
  );

  const selectedIntervention = useMemo(
    () => interventions.find((item) => item.id === selectedInterventionId) || null,
    [interventions, selectedInterventionId]
  );

  /* ─── data loading ─── */

  const loadUbs = async () => {
    try {
      const data = await ubsService.getSingleUbs();
      setUbsInfo(data);
      setUbsId(data ? String(data.id) : '');
    } catch (error) {
      setUbsInfo(null);
      setUbsId('');
      notify({ type: 'error', message: 'Erro ao carregar UBS.' });
    }
  };

  const loadProblems = async (ubsId) => {
    if (!ubsId) return;
    try {
      const data = await api.request(`/ubs/${ubsId}/problems`, { requiresAuth: true });
      const items = Array.isArray(data) ? data : [];
      setProblems(items);
      if (items.length > 0) {
        setSelectedProblemId(items[0].id);
      } else {
        setSelectedProblemId(null);
      }
      setProblemEditForm(null);
    } catch (error) {
      setProblems([]);
      setSelectedProblemId(null);
      notify({ type: 'error', message: 'Erro ao carregar problemas.' });
    }
  };

  const loadInterventions = async (problemId) => {
    if (!problemId) {
      setInterventions([]);
      setSelectedInterventionId(null);
      return;
    }
    try {
      const data = await api.request(`/ubs/problems/${problemId}/interventions`, {
        requiresAuth: true,
      });
      const items = Array.isArray(data) ? data : [];
      setInterventions(items);
      if (items.length > 0) {
        setSelectedInterventionId(items[0].id);
      } else {
        setSelectedInterventionId(null);
      }
      setInterventionEditForm(null);
    } catch (error) {
      setInterventions([]);
      setSelectedInterventionId(null);
      notify({ type: 'error', message: 'Erro ao carregar intervenções.' });
    }
  };

  const loadActions = async (interventionId) => {
    if (!interventionId) {
      setActions([]);
      return;
    }
    try {
      const data = await api.request(`/ubs/interventions/${interventionId}/actions`, {
        requiresAuth: true,
      });
      setActions(Array.isArray(data) ? data : []);
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao carregar ações.' });
    }
  };

  useEffect(() => { loadUbs(); }, []);
  useEffect(() => { if (ubsId) loadProblems(ubsId); }, [ubsId]);
  useEffect(() => {
    if (!selectedProblemId) {
      setInterventions([]);
      setSelectedInterventionId(null);
      return;
    }
    loadInterventions(selectedProblemId);
  }, [selectedProblemId]);
  useEffect(() => { loadActions(selectedInterventionId); }, [selectedInterventionId]);

  useEffect(() => {
    if (!selectedProblem) { setProblemEditForm(null); return; }
    setProblemEditForm({
      titulo: selectedProblem.titulo || '',
      descricao: selectedProblem.descricao || '',
      gut_gravidade: selectedProblem.gut_gravidade,
      gut_urgencia: selectedProblem.gut_urgencia,
      gut_tendencia: selectedProblem.gut_tendencia,
      is_prioritario: selectedProblem.is_prioritario,
    });
  }, [selectedProblem]);

  useEffect(() => {
    if (!selectedIntervention) { setInterventionEditForm(null); return; }
    setInterventionEditForm({
      objetivo: selectedIntervention.objetivo || '',
      metas: selectedIntervention.metas || '',
      responsavel: selectedIntervention.responsavel || '',
      status: selectedIntervention.status || 'PLANEJADO',
    });
  }, [selectedIntervention]);

  /* ─── handlers ─── */

  const handleCreateProblem = async (event) => {
    event.preventDefault();
    if (!ubsId) {
      notify({ type: 'warning', message: 'Configure uma UBS antes de registrar problemas.' });
      return;
    }
    try {
      await api.request(`/ubs/${ubsId}/problems`, {
        method: 'POST',
        requiresAuth: true,
        body: {
          ...problemForm,
          gut_gravidade: Number(problemForm.gut_gravidade),
          gut_urgencia: Number(problemForm.gut_urgencia),
          gut_tendencia: Number(problemForm.gut_tendencia),
          is_prioritario: Boolean(problemForm.is_prioritario),
        },
      });
      notify({ type: 'success', message: 'Problema registrado.' });
      setProblemForm(emptyProblemForm);
      setShowProblemForm(false);
      await loadProblems(ubsId);
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao salvar problema.' });
    }
  };

  const handleUpdateProblem = async () => {
    if (!selectedProblem || !problemEditForm) return;
    try {
      await api.request(`/ubs/problems/${selectedProblem.id}`, {
        method: 'PATCH',
        requiresAuth: true,
        body: {
          ...problemEditForm,
          gut_gravidade: Number(problemEditForm.gut_gravidade),
          gut_urgencia: Number(problemEditForm.gut_urgencia),
          gut_tendencia: Number(problemEditForm.gut_tendencia),
          is_prioritario: Boolean(problemEditForm.is_prioritario),
        },
      });
      notify({ type: 'success', message: 'Problema atualizado.' });
      await loadProblems(ubsId);
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao atualizar problema.' });
    }
  };

  const handleDeleteProblem = async (problemId) => {
    const confirmed = await confirm({
      title: 'Excluir problema',
      message: 'Tem certeza que deseja remover este problema e todas as suas intervenções e ações?',
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      await api.request(`/ubs/problems/${problemId}`, {
        method: 'DELETE',
        requiresAuth: true,
      });
      notify({ type: 'success', message: 'Problema removido.' });
      await loadProblems(ubsId);
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao remover problema.' });
    }
  };

  const handleCreateIntervention = async (event) => {
    event.preventDefault();
    if (!selectedProblem) return;
    try {
      await api.request(`/ubs/problems/${selectedProblem.id}/interventions`, {
        method: 'POST',
        requiresAuth: true,
        body: interventionForm,
      });
      notify({ type: 'success', message: 'Intervenção criada.' });
      setInterventionForm(emptyInterventionForm);
      setShowInterventionForm(false);
      await loadInterventions(selectedProblem.id);
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao criar intervenção.' });
    }
  };

  const handleUpdateIntervention = async () => {
    if (!selectedIntervention || !interventionEditForm) return;
    try {
      await api.request(`/ubs/interventions/${selectedIntervention.id}`, {
        method: 'PATCH',
        requiresAuth: true,
        body: interventionEditForm,
      });
      notify({ type: 'success', message: 'Intervenção atualizada.' });
      await loadInterventions(selectedProblem.id);
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao atualizar intervenção.' });
    }
  };

  const handleDeleteIntervention = async (interventionId) => {
    const confirmed = await confirm({
      title: 'Excluir intervenção',
      message: 'Deseja remover esta intervenção e suas ações?',
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      await api.request(`/ubs/interventions/${interventionId}`, {
        method: 'DELETE',
        requiresAuth: true,
      });
      notify({ type: 'success', message: 'Intervenção removida.' });
      await loadInterventions(selectedProblem.id);
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao remover intervenção.' });
    }
  };

  const handleCreateAction = async (event) => {
    event.preventDefault();
    if (!selectedIntervention) return;
    try {
      await api.request(`/ubs/interventions/${selectedIntervention.id}/actions`, {
        method: 'POST',
        requiresAuth: true,
        body: actionForm,
      });
      notify({ type: 'success', message: 'Ação registrada.' });
      setActionForm(emptyActionForm);
      setShowActionForm(false);
      await loadActions(selectedIntervention.id);
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao registrar ação.' });
    }
  };

  const handleUpdateAction = async () => {
    if (!actionEditForm || !actionEditForm.id) return;
    try {
      await api.request(`/ubs/intervention-actions/${actionEditForm.id}`, {
        method: 'PATCH',
        requiresAuth: true,
        body: {
          acao: actionEditForm.acao,
          prazo: actionEditForm.prazo || null,
          status: actionEditForm.status,
          observacoes: actionEditForm.observacoes,
        },
      });
      notify({ type: 'success', message: 'Ação atualizada.' });
      setActionEditForm(null);
      await loadActions(selectedIntervention.id);
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao atualizar ação.' });
    }
  };

  const handleDeleteAction = async (actionId) => {
    const confirmed = await confirm({
      title: 'Excluir ação',
      message: 'Deseja remover esta ação?',
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      await api.request(`/ubs/intervention-actions/${actionId}`, {
        method: 'DELETE',
        requiresAuth: true,
      });
      notify({ type: 'success', message: 'Ação removida.' });
      await loadActions(selectedIntervention.id);
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao remover ação.' });
    }
  };

  /* ─── computed ─── */

  const problemScore = gutScore(
    problemForm.gut_gravidade,
    problemForm.gut_urgencia,
    problemForm.gut_tendencia
  );

  const problemEditScore = problemEditForm
    ? gutScore(problemEditForm.gut_gravidade, problemEditForm.gut_urgencia, problemEditForm.gut_tendencia)
    : 0;

  const problemStats = useMemo(() => {
    const total = problems.length;
    const prioridade = problems.filter((item) => item.is_prioritario).length;
    const criticos = problems.filter((item) => item.gut_score >= 80).length;
    return { total, prioridade, criticos };
  }, [problems]);

  const sortedProblems = useMemo(
    () => [...problems].sort((a, b) => b.gut_score - a.gut_score),
    [problems]
  );

  /* ─── render ─── */

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">

        {/* ═══ HEADER ═══ */}
        <section className={`${cardClass} relative overflow-hidden p-6 sm:p-8 rise-fade`}>
          <div
            className="absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-30 dark:opacity-20"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.4), transparent 65%)' }}
          />
          <div
            className="absolute -bottom-28 left-10 h-64 w-64 rounded-full opacity-30 dark:opacity-20"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.35), transparent 65%)' }}
          />
          <div className="relative z-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                  Mapa estratégico
                </p>
                <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  Problemas e Intervenções
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                  Identifique problemas, priorize com a matriz GUT e planeje intervenções com ações
                  concretas, responsáveis e prazos.
                </p>
              </div>

              {/* Stats cards */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-900 dark:bg-slate-800 px-5 py-4 text-white shadow-lg">
                  <ChartBarIcon className="h-7 w-7 text-sky-300" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-300">Problemas</p>
                    <p className="text-2xl font-bold">{problemStats.total}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-900 dark:bg-slate-800 px-5 py-4 text-white shadow-lg">
                  <ExclamationTriangleIcon className="h-7 w-7 text-red-300" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-300">Críticos</p>
                    <p className="text-2xl font-bold">{problemStats.criticos}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-900 dark:bg-slate-800 px-5 py-4 text-white shadow-lg">
                  <FlagIcon className="h-7 w-7 text-amber-300" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-300">Prioritários</p>
                    <p className="text-2xl font-bold">{problemStats.prioridade}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Flow breadcrumb */}
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
              <span className={`rounded-full px-3 py-1.5 ${selectedProblem ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                1. Problema
              </span>
              <ChevronRightIcon className="h-3.5 w-3.5" />
              <span className={`rounded-full px-3 py-1.5 ${selectedIntervention ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                2. Intervenção
              </span>
              <ChevronRightIcon className="h-3.5 w-3.5" />
              <span className={`rounded-full px-3 py-1.5 ${actions.length > 0 ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                3. Ações
              </span>
            </div>
          </div>
        </section>

        {/* ═══ STEP 1: PROBLEMAS ═══ */}
        <section className="mt-8 rise-fade stagger-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <ExclamationTriangleIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Problemas identificados
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Selecione um problema para gerenciar intervenções
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowProblemForm(!showProblemForm)}
              className={`${showProblemForm ? btnSecondary : btnPrimary} !w-auto`}
            >
              {showProblemForm ? (
                <><XMarkIcon className="h-5 w-5" /> Cancelar</>
              ) : (
                <><PlusIcon className="h-5 w-5" /> Novo problema</>
              )}
            </button>
          </div>

          {/* New problem form */}
          {showProblemForm && (
            <div className={`${cardClass} p-6 mb-6 rise-fade`}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <form onSubmit={handleCreateProblem} id="problem-form" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Título do problema *
                      </label>
                      <input
                        className={inputClass}
                        placeholder="Ex: Falta de medicamentos básicos na farmácia"
                        value={problemForm.titulo}
                        onChange={(e) => setProblemForm((p) => ({ ...p, titulo: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Descrição
                      </label>
                      <textarea
                        className={inputClass}
                        rows={3}
                        placeholder="Descreva o problema com mais detalhes..."
                        value={problemForm.descricao}
                        onChange={(e) => setProblemForm((p) => ({ ...p, descricao: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <GutSelector
                        label="Gravidade"
                        icon={FireIcon}
                        value={problemForm.gut_gravidade}
                        onChange={(v) => setProblemForm((p) => ({ ...p, gut_gravidade: v }))}
                      />
                      <GutSelector
                        label="Urgência"
                        icon={BoltIcon}
                        value={problemForm.gut_urgencia}
                        onChange={(v) => setProblemForm((p) => ({ ...p, gut_urgencia: v }))}
                      />
                      <GutSelector
                        label="Tendência"
                        icon={ArrowTrendingUpIcon}
                        value={problemForm.gut_tendencia}
                        onChange={(v) => setProblemForm((p) => ({ ...p, gut_tendencia: v }))}
                      />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={problemForm.is_prioritario}
                        onChange={(e) => setProblemForm((p) => ({ ...p, is_prioritario: e.target.checked }))}
                        className="h-5 w-5 rounded border-amber-300 text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Marcar como prioritário</span>
                        <p className="text-xs text-amber-600 dark:text-amber-400">Destaca este problema na lista de prioridades</p>
                      </div>
                    </label>
                  </form>
                </div>

                <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Score GUT
                  </p>
                  <ScoreBadge score={problemScore} size="lg" />
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                    G({problemForm.gut_gravidade}) x U({problemForm.gut_urgencia}) x T({problemForm.gut_tendencia})
                  </p>
                  <button type="submit" form="problem-form" className={`${btnPrimary} mt-2`}>
                    <PlusIcon className="h-5 w-5" />
                    Registrar problema
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <GutInfoPanel />
              </div>
            </div>
          )}

          {/* Problem list */}
          {problems.length === 0 ? (
            <EmptyState
              icon={ClipboardDocumentCheckIcon}
              message='Nenhum problema registrado. Clique em "Novo problema" para começar a mapear os desafios da sua unidade.'
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedProblems.map((problem) => {
                const isSelected = problem.id === selectedProblemId;
                const level = scoreLevel(problem.gut_score);
                return (
                  <button
                    key={problem.id}
                    onClick={() => setSelectedProblemId(problem.id)}
                    className={`group relative flex flex-col text-left rounded-2xl border-2 p-5 transition-all ${
                      isSelected
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md shadow-blue-500/10'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className={`text-sm font-semibold leading-snug ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-white'}`}>
                        {problem.titulo}
                      </h3>
                      <ScoreBadge score={problem.gut_score} size="sm" />
                    </div>
                    {problem.descricao && (
                      <p className={`mt-2 text-xs line-clamp-2 ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        {problem.descricao}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {problem.is_prioritario && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                          <StarIcon className="h-3 w-3" />
                          Prioritário
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        G:{problem.gut_gravidade} U:{problem.gut_urgencia} T:{problem.gut_tendencia}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-blue-500 dark:bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ PROBLEM EDIT PANEL ═══ */}
        {selectedProblem && problemEditForm && (
          <section className={`${cardClass} mt-6 p-6 rise-fade`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <SectionHeader
                icon={PencilSquareIcon}
                title={`Editando: ${selectedProblem.titulo}`}
                subtitle="Ajuste os dados e a priorização GUT"
                iconColor="text-amber-600 dark:text-amber-400"
              />
              <button onClick={() => handleDeleteProblem(selectedProblem.id)} className={btnDanger}>
                <TrashIcon className="h-4 w-4" />
                Excluir problema
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Título</label>
                  <input
                    className={inputClass}
                    value={problemEditForm.titulo}
                    onChange={(e) => setProblemEditForm((p) => ({ ...p, titulo: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descrição</label>
                  <input
                    className={inputClass}
                    value={problemEditForm.descricao}
                    onChange={(e) => setProblemEditForm((p) => ({ ...p, descricao: e.target.value }))}
                    placeholder="Descrição"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <GutSelector
                    label="Gravidade"
                    icon={FireIcon}
                    value={problemEditForm.gut_gravidade}
                    onChange={(v) => setProblemEditForm((p) => ({ ...p, gut_gravidade: v }))}
                  />
                  <GutSelector
                    label="Urgência"
                    icon={BoltIcon}
                    value={problemEditForm.gut_urgencia}
                    onChange={(v) => setProblemEditForm((p) => ({ ...p, gut_urgencia: v }))}
                  />
                  <GutSelector
                    label="Tendência"
                    icon={ArrowTrendingUpIcon}
                    value={problemEditForm.gut_tendencia}
                    onChange={(v) => setProblemEditForm((p) => ({ ...p, gut_tendencia: v }))}
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={problemEditForm.is_prioritario}
                    onChange={(e) => setProblemEditForm((p) => ({ ...p, is_prioritario: e.target.checked }))}
                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Marcar como prioritário</span>
                </label>
              </div>

              <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Score GUT</p>
                <ScoreBadge score={problemEditScore} size="lg" />
                <button onClick={handleUpdateProblem} className={`${btnPrimary} mt-2`}>
                  <PencilSquareIcon className="h-5 w-5" />
                  Salvar alterações
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ═══ STEP 2 & 3: INTERVENÇÕES + AÇÕES ═══ */}
        {selectedProblem && (
          <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 rise-fade stagger-2">

            {/* ── Intervenções ── */}
            <div className={`${cardClass} p-6`}>
              <div className="flex items-start justify-between gap-3 mb-5">
                <SectionHeader
                  icon={LightBulbIcon}
                  title="Intervenções"
                  subtitle={`Soluções para: ${selectedProblem.titulo}`}
                  iconColor="text-emerald-600 dark:text-emerald-400"
                />
                <button
                  onClick={() => setShowInterventionForm(!showInterventionForm)}
                  className={`shrink-0 ${showInterventionForm ? btnSecondary : btnPrimary} !w-auto !py-2.5 !text-xs`}
                >
                  {showInterventionForm ? <XMarkIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                  <span className="hidden sm:inline">{showInterventionForm ? 'Cancelar' : 'Nova'}</span>
                </button>
              </div>

              {showInterventionForm && (
                <form onSubmit={handleCreateIntervention} className="space-y-3 mb-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 rise-fade">
                  <input className={inputClass} placeholder="Objetivo da intervenção *" value={interventionForm.objetivo}
                    onChange={(e) => setInterventionForm((p) => ({ ...p, objetivo: e.target.value }))} required />
                  <input className={inputClass} placeholder="Metas" value={interventionForm.metas}
                    onChange={(e) => setInterventionForm((p) => ({ ...p, metas: e.target.value }))} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input className={inputClass} placeholder="Responsável" value={interventionForm.responsavel}
                      onChange={(e) => setInterventionForm((p) => ({ ...p, responsavel: e.target.value }))} />
                    <select className={selectClass} value={interventionForm.status}
                      onChange={(e) => setInterventionForm((p) => ({ ...p, status: e.target.value }))}>
                      {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <button type="submit" className={btnPrimary}>
                    <PlusIcon className="h-4 w-4" /> Adicionar intervenção
                  </button>
                </form>
              )}

              {interventions.length === 0 ? (
                <EmptyState icon={LightBulbIcon} message="Nenhuma intervenção. Crie uma para definir como resolver este problema." />
              ) : (
                <div className="space-y-2">
                  {interventions.map((intervention) => {
                    const isSelected = intervention.id === selectedInterventionId;
                    return (
                      <button
                        key={intervention.id}
                        onClick={() => setSelectedInterventionId(intervention.id)}
                        className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all ${
                          isSelected
                            ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${isSelected ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-900 dark:text-white'}`}>
                            {intervention.objetivo}
                          </p>
                          {intervention.responsavel && (
                            <p className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              <UserIcon className="h-3 w-3" />{intervention.responsavel}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={intervention.status} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Edit intervention inline */}
              {selectedIntervention && interventionEditForm && (
                <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3 rise-fade">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <PencilSquareIcon className="h-4 w-4 text-slate-400" />
                    Editar intervenção
                  </h4>
                  <input className={inputClass} value={interventionEditForm.objetivo} placeholder="Objetivo"
                    onChange={(e) => setInterventionEditForm((p) => ({ ...p, objetivo: e.target.value }))} />
                  <input className={inputClass} value={interventionEditForm.metas} placeholder="Metas"
                    onChange={(e) => setInterventionEditForm((p) => ({ ...p, metas: e.target.value }))} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input className={inputClass} value={interventionEditForm.responsavel} placeholder="Responsável"
                      onChange={(e) => setInterventionEditForm((p) => ({ ...p, responsavel: e.target.value }))} />
                    <select className={selectClass} value={interventionEditForm.status}
                      onChange={(e) => setInterventionEditForm((p) => ({ ...p, status: e.target.value }))}>
                      {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={handleUpdateIntervention} className={`${btnPrimary} !w-auto`}>
                      <PencilSquareIcon className="h-4 w-4" /> Salvar
                    </button>
                    <button onClick={() => handleDeleteIntervention(selectedIntervention.id)} className={btnDanger}>
                      <TrashIcon className="h-4 w-4" /> Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Ações ── */}
            <div className={`${cardClass} p-6`}>
              <div className="flex items-start justify-between gap-3 mb-5">
                <SectionHeader
                  icon={ClipboardDocumentCheckIcon}
                  title="Ações"
                  subtitle={selectedIntervention ? `Tarefas da intervenção selecionada` : 'Selecione uma intervenção'}
                  iconColor="text-violet-600 dark:text-violet-400"
                />
                {selectedIntervention && (
                  <button
                    onClick={() => setShowActionForm(!showActionForm)}
                    className={`shrink-0 ${showActionForm ? btnSecondary : btnPrimary} !w-auto !py-2.5 !text-xs`}
                  >
                    {showActionForm ? <XMarkIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                    <span className="hidden sm:inline">{showActionForm ? 'Cancelar' : 'Nova'}</span>
                  </button>
                )}
              </div>

              {showActionForm && selectedIntervention && (
                <form onSubmit={handleCreateAction} className="space-y-3 mb-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 rise-fade">
                  <input className={inputClass} placeholder="Descrição da ação *" value={actionForm.acao}
                    onChange={(e) => setActionForm((p) => ({ ...p, acao: e.target.value }))} required />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Prazo</label>
                      <input className={inputClass} type="date" value={actionForm.prazo}
                        onChange={(e) => setActionForm((p) => ({ ...p, prazo: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
                      <select className={selectClass} value={actionForm.status}
                        onChange={(e) => setActionForm((p) => ({ ...p, status: e.target.value }))}>
                        {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <textarea className={inputClass} rows={2} placeholder="Observações" value={actionForm.observacoes}
                    onChange={(e) => setActionForm((p) => ({ ...p, observacoes: e.target.value }))} />
                  <button type="submit" className={btnPrimary}>
                    <PlusIcon className="h-4 w-4" /> Adicionar ação
                  </button>
                </form>
              )}

              {!selectedIntervention ? (
                <EmptyState icon={ClipboardDocumentCheckIcon} message="Selecione uma intervenção ao lado para ver e gerenciar suas ações." />
              ) : actions.length === 0 ? (
                <EmptyState icon={ClipboardDocumentCheckIcon} message='Nenhuma ação registrada. Clique em "Nova" para adicionar tarefas concretas.' />
              ) : (
                <div className="space-y-3">
                  {actions.map((action) => (
                    <div key={action.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 transition-colors hover:border-slate-300 dark:hover:border-slate-600">
                      {actionEditForm?.id === action.id ? (
                        /* Edit mode */
                        <div className="space-y-3 rise-fade">
                          <input className={inputClass} value={actionEditForm.acao}
                            onChange={(e) => setActionEditForm((p) => ({ ...p, acao: e.target.value }))} />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input className={inputClass} type="date" value={actionEditForm.prazo}
                              onChange={(e) => setActionEditForm((p) => ({ ...p, prazo: e.target.value }))} />
                            <select className={selectClass} value={actionEditForm.status}
                              onChange={(e) => setActionEditForm((p) => ({ ...p, status: e.target.value }))}>
                              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          </div>
                          <textarea className={inputClass} rows={2} value={actionEditForm.observacoes} placeholder="Observações"
                            onChange={(e) => setActionEditForm((p) => ({ ...p, observacoes: e.target.value }))} />
                          <div className="flex flex-wrap gap-2">
                            <button onClick={handleUpdateAction} className={`${btnPrimary} !w-auto`}>
                              <CheckCircleIcon className="h-4 w-4" /> Salvar
                            </button>
                            <button onClick={() => setActionEditForm(null)} className={btnSecondary}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Display mode */
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{action.acao}</p>
                            <StatusBadge status={action.status} />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDaysIcon className="h-3.5 w-3.5" />
                              {action.prazo || 'Sem prazo'}
                            </span>
                            {action.observacoes && (
                              <span className="inline-flex items-center gap-1">
                                <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
                                {action.observacoes}
                              </span>
                            )}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => setActionEditForm({
                                id: action.id,
                                acao: action.acao,
                                prazo: action.prazo || '',
                                status: action.status || 'PLANEJADO',
                                observacoes: action.observacoes || '',
                              })}
                              className={btnSecondary + ' !py-1.5 !px-3 !text-xs'}
                            >
                              <PencilSquareIcon className="h-3.5 w-3.5" /> Editar
                            </button>
                            <button onClick={() => handleDeleteAction(action.id)} className={btnDanger + ' !py-1.5 !px-3 !text-xs'}>
                              <TrashIcon className="h-3.5 w-3.5" /> Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* No problem selected hint */}
        {!selectedProblem && problems.length > 0 && (
          <div className="mt-8 rise-fade">
            <EmptyState icon={ChevronRightIcon} message="Selecione um problema acima para visualizar e gerenciar suas intervenções e ações." />
          </div>
        )}

      </div>
    </div>
  );
};

export default MapaProblemasIntervencoes;
