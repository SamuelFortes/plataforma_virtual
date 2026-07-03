import { useCallback, useEffect, useState } from 'react';
import {
  CalendarDaysIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  FunnelIcon,
  MapPinIcon,
  ClockIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { useNotifications } from '../components/ui/Notifications';

/* ─── helpers ─── */

const toInputDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
};

const toInputDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const formatTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

/* ─── constantes ─── */

const TIPO_OPTIONS = [
  { value: 'SALA_VACINA', label: 'Sala de vacina', color: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  { value: 'FARMACIA_BASICA', label: 'Farmácia básica', color: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
  { value: 'REUNIAO_EQUIPE', label: 'Reunião da equipe', color: 'bg-violet-500', light: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
  { value: 'OUTRO', label: 'Outro', color: 'bg-slate-500', light: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
];

const RECORRENCIA_OPTIONS = [
  { value: 'NONE', label: 'Sem recorrência' },
  { value: 'DAILY', label: 'Diária' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
];

const MOCK_UBS_ADALTO = {
  id: 3,
  nome_ubs: 'ESF 41 - Adalto Parentes Sampaio',
  cnes: '0000000',
  area_atuacao: 'Baixa do Aragao, Parnaiba - PI',
  status: 'DRAFT',
};

const getTipo = (value) => TIPO_OPTIONS.find((t) => t.value === value) || TIPO_OPTIONS[3];

/* ─── reusable classes ─── */

const inputClass =
  'w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-colors';

const selectClass = inputClass;

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5';

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const btnSecondary =
  'inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors';

const btnDanger =
  'inline-flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 transition-colors';

const cardClass =
  'rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-colors';

/* ─── mini calendar helper ─── */

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const MiniCalendar = ({ events }) => {
  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const eventDays = new Set();
  events.forEach((e) => {
    const d = new Date(e.inicio);
    if (d.getFullYear() === year && d.getMonth() === month) {
      eventDays.add(d.getDate());
    }
  });

  const prev = () => setViewDate(new Date(year, month - 1, 1));
  const next = () => setViewDate(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{MONTHS[month]} {year}</span>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-1">{w}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center">
            {day ? (
              <div className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors ${
                isToday(day)
                  ? 'bg-blue-600 dark:bg-blue-500 text-white font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}>
                {day}
                {eventDays.has(day) && (
                  <span className={`absolute -bottom-0.5 h-1 w-1 rounded-full ${isToday(day) ? 'bg-white' : 'bg-blue-500 dark:bg-blue-400'}`} />
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── componente principal ─── */

const Cronograma = () => {
  const { notify, confirm } = useNotifications();
  const [ubsOptions, setUbsOptions] = useState([]);
  const [selectedUbs, setSelectedUbs] = useState('');
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ start: '', end: '' });

  const [form, setForm] = useState({
    titulo: '',
    tipo: 'SALA_VACINA',
    local: '',
    inicio: '',
    fim: '',
    dia_inteiro: false,
    observacoes: '',
    recorrencia: 'NONE',
    recorrencia_intervalo: 1,
    recorrencia_fim: '',
  });

  const loadUbs = useCallback(async () => {
    try {
      const data = await api.request('/ubs?page=1&page_size=100', { requiresAuth: true });
      const items = data?.items || [];
      if (items.length > 0) {
        setUbsOptions(items);
        if (!selectedUbs) setSelectedUbs(String(items[0].id));
      } else {
        setUbsOptions([MOCK_UBS_ADALTO]);
        if (!selectedUbs) setSelectedUbs(String(MOCK_UBS_ADALTO.id));
      }
    } catch (error) {
      setUbsOptions([MOCK_UBS_ADALTO]);
      if (!selectedUbs) setSelectedUbs(String(MOCK_UBS_ADALTO.id));
      notify({ type: 'error', message: 'Erro ao carregar UBS.' });
    }
  }, [notify, selectedUbs]);

  const loadEvents = useCallback(async () => {
    if (!selectedUbs) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ ubs_id: selectedUbs });
      if (filters.start) params.append('start', new Date(filters.start).toISOString());
      if (filters.end) params.append('end', new Date(filters.end).toISOString());
      const data = await api.request(`/cronograma?${params.toString()}`, { requiresAuth: true });
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      setEvents([]);
      notify({ type: 'error', message: 'Erro ao carregar cronograma.' });
    } finally {
      setIsLoading(false);
    }
  }, [filters.end, filters.start, notify, selectedUbs]);

  useEffect(() => { loadUbs(); }, [loadUbs]);
  useEffect(() => { loadEvents(); }, [loadEvents]);

  const resetForm = () => {
    setForm({
      titulo: '', tipo: 'SALA_VACINA', local: '', inicio: '', fim: '',
      dia_inteiro: false, observacoes: '', recorrencia: 'NONE',
      recorrencia_intervalo: 1, recorrencia_fim: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedUbs) { notify({ type: 'warning', message: 'Selecione uma UBS.' }); return; }
    if (!form.inicio) { notify({ type: 'warning', message: 'Informe a data de início.' }); return; }

    setIsSubmitting(true);
    try {
      const inicioValue = form.dia_inteiro
        ? new Date(`${form.inicio}T00:00:00`).toISOString()
        : new Date(form.inicio).toISOString();
      const fimValue = form.fim
        ? form.dia_inteiro
          ? new Date(`${form.fim}T23:59:59`).toISOString()
          : new Date(form.fim).toISOString()
        : null;

      const payload = {
        ubs_id: Number(selectedUbs),
        titulo: form.titulo,
        tipo: form.tipo,
        local: form.local || null,
        inicio: inicioValue,
        fim: fimValue,
        dia_inteiro: form.dia_inteiro,
        observacoes: form.observacoes || null,
        recorrencia: form.recorrencia,
        recorrencia_intervalo: Number(form.recorrencia_intervalo || 1),
        recorrencia_fim: form.recorrencia_fim || null,
      };

      if (editingId) {
        await api.request(`/cronograma/${editingId}`, { method: 'PATCH', requiresAuth: true, body: payload });
        notify({ type: 'success', message: 'Evento atualizado.' });
      } else {
        await api.request('/cronograma', { method: 'POST', requiresAuth: true, body: payload });
        notify({ type: 'success', message: 'Evento criado.' });
      }
      resetForm();
      await loadEvents();
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao salvar evento.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (evento) => {
    setEditingId(evento.id);
    setShowForm(true);
    setForm({
      titulo: evento.titulo,
      tipo: evento.tipo,
      local: evento.local || '',
      inicio: evento.dia_inteiro ? toInputDate(evento.inicio) : toInputDateTime(evento.inicio),
      fim: evento.dia_inteiro ? toInputDate(evento.fim) : toInputDateTime(evento.fim),
      dia_inteiro: evento.dia_inteiro,
      observacoes: evento.observacoes || '',
      recorrencia: evento.recorrencia,
      recorrencia_intervalo: evento.recorrencia_intervalo || 1,
      recorrencia_fim: evento.recorrencia_fim || '',
    });
  };

  const handleDelete = async (eventId) => {
    const confirmed = await confirm({
      title: 'Remover evento',
      message: 'Deseja remover este evento do cronograma?',
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      await api.request(`/cronograma/${eventId}`, { method: 'DELETE', requiresAuth: true });
      await loadEvents();
      notify({ type: 'success', message: 'Evento removido.' });
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao remover evento.' });
    }
  };

  /* ─── stats ─── */
  const totalEvents = events.length;
  const upcomingEvents = events.filter((e) => new Date(e.inicio) >= new Date()).length;

  /* ─── render ─── */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">

        {/* ═══ HEADER ═══ */}
        <section className={`${cardClass} relative overflow-hidden p-6 sm:p-8 rise-fade`}>
          <div
            className="absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-30 dark:opacity-20"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.4), transparent 65%)' }}
          />
          <div
            className="absolute -bottom-28 left-10 h-64 w-64 rounded-full opacity-30 dark:opacity-20"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.35), transparent 65%)' }}
          />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                Organização
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Cronograma e Calendário
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Organize sala de vacina, farmácia básica, reuniões da equipe e outros eventos da unidade.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-900 dark:bg-slate-800 px-5 py-4 text-white shadow-lg">
                <CalendarDaysIcon className="h-7 w-7 text-violet-300" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-300">Total</p>
                  <p className="text-2xl font-bold">{totalEvents}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-900 dark:bg-slate-800 px-5 py-4 text-white shadow-lg">
                <ClockIcon className="h-7 w-7 text-blue-300" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-300">Próximos</p>
                  <p className="text-2xl font-bold">{upcomingEvents}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ═══ SIDEBAR ═══ */}
          <aside className="lg:col-span-4 space-y-6 rise-fade stagger-1">

            {/* UBS selector */}
            <div className={`${cardClass} p-5`}>
              <label className={labelClass}>UBS ativa</label>
              <select
                value={selectedUbs}
                onChange={(e) => setSelectedUbs(e.target.value)}
                className={selectClass}
              >
                {ubsOptions.map((ubs) => (
                  <option key={ubs.id} value={ubs.id}>{ubs.nome_ubs}</option>
                ))}
              </select>
            </div>

            {/* Mini calendar */}
            <div className={`${cardClass} p-5`}>
              <MiniCalendar events={events} />
            </div>

            {/* Tipo legend */}
            <div className={`${cardClass} p-5`}>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Tipos de evento</h3>
              <div className="space-y-2">
                {TIPO_OPTIONS.map((t) => (
                  <div key={t.value} className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${t.color}`} />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className={`${cardClass} p-5`}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex w-full items-center justify-between text-sm font-semibold text-slate-900 dark:text-white"
              >
                <span className="flex items-center gap-2">
                  <FunnelIcon className="h-4 w-4 text-slate-400" />
                  Filtrar por período
                </span>
                <ChevronRightIcon className={`h-4 w-4 text-slate-400 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
              </button>
              {showFilters && (
                <div className="mt-4 space-y-3 rise-fade">
                  <div>
                    <label className={labelClass}>Início</label>
                    <input
                      type="datetime-local"
                      value={filters.start}
                      onChange={(e) => setFilters((p) => ({ ...p, start: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Fim</label>
                    <input
                      type="datetime-local"
                      value={filters.end}
                      onChange={(e) => setFilters((p) => ({ ...p, end: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  {(filters.start || filters.end) && (
                    <button
                      onClick={() => setFilters({ start: '', end: '' })}
                      className={`${btnSecondary} w-full justify-center`}
                    >
                      <XMarkIcon className="h-4 w-4" /> Limpar filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* ═══ MAIN CONTENT ═══ */}
          <main className="lg:col-span-8 space-y-6 rise-fade stagger-2">

            {/* Actions bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                  <CalendarDaysIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Eventos</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {events.length} evento{events.length !== 1 ? 's' : ''} registrado{events.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (showForm && !editingId) { setShowForm(false); }
                  else { resetForm(); setShowForm(true); }
                }}
                className={`${showForm && !editingId ? btnSecondary : btnPrimary} !w-auto`}
              >
                {showForm && !editingId ? (
                  <><XMarkIcon className="h-5 w-5" /> Cancelar</>
                ) : (
                  <><PlusIcon className="h-5 w-5" /> Novo evento</>
                )}
              </button>
            </div>

            {/* ── Event form ── */}
            {showForm && (
              <div className={`${cardClass} p-6 rise-fade`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {editingId ? <PencilSquareIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {editingId ? 'Editar evento' : 'Criar novo evento'}
                  </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Título *</label>
                      <input
                        value={form.titulo}
                        onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                        className={inputClass}
                        placeholder="Ex: Vacinação contra gripe"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Tipo</label>
                      <select value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))} className={selectClass}>
                        {TIPO_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Local</label>
                      <input
                        value={form.local}
                        onChange={(e) => setForm((p) => ({ ...p, local: e.target.value }))}
                        className={inputClass}
                        placeholder="Ex: Sala 3"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={form.dia_inteiro}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          dia_inteiro: e.target.checked,
                          inicio: e.target.checked ? p.inicio.slice(0, 10) : p.inicio,
                          fim: e.target.checked ? p.fim.slice(0, 10) : p.fim,
                        }))
                      }
                      className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Evento de dia inteiro</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Sem horário específico de início e fim</p>
                    </div>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Início *</label>
                      <input
                        type={form.dia_inteiro ? 'date' : 'datetime-local'}
                        value={form.inicio}
                        onChange={(e) => setForm((p) => ({ ...p, inicio: e.target.value }))}
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Fim</label>
                      <input
                        type={form.dia_inteiro ? 'date' : 'datetime-local'}
                        value={form.fim}
                        onChange={(e) => setForm((p) => ({ ...p, fim: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Recorrência</label>
                      <select value={form.recorrencia} onChange={(e) => setForm((p) => ({ ...p, recorrencia: e.target.value }))} className={selectClass}>
                        {RECORRENCIA_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    {form.recorrencia !== 'NONE' && (
                      <>
                        <div>
                          <label className={labelClass}>Intervalo</label>
                          <input
                            type="number"
                            min={1}
                            value={form.recorrencia_intervalo}
                            onChange={(e) => setForm((p) => ({ ...p, recorrencia_intervalo: e.target.value }))}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Fim da recorrência</label>
                          <input
                            type="date"
                            value={form.recorrencia_fim}
                            onChange={(e) => setForm((p) => ({ ...p, recorrencia_fim: e.target.value }))}
                            className={inputClass}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Observações</label>
                    <textarea
                      value={form.observacoes}
                      onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
                      rows={3}
                      className={inputClass}
                      placeholder="Informações adicionais sobre o evento..."
                    />
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 pt-2">
                    {editingId && (
                      <button type="button" onClick={resetForm} className={btnSecondary}>
                        <XMarkIcon className="h-4 w-4" /> Cancelar edição
                      </button>
                    )}
                    <button type="submit" disabled={isSubmitting} className={btnPrimary}>
                      {isSubmitting ? (
                        <><ArrowPathIcon className="h-4 w-4 animate-spin" /> Salvando...</>
                      ) : editingId ? (
                        <><PencilSquareIcon className="h-4 w-4" /> Atualizar evento</>
                      ) : (
                        <><PlusIcon className="h-4 w-4" /> Criar evento</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Event list ── */}
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <ArrowPathIcon className="h-8 w-8 text-slate-400 dark:text-slate-500 animate-spin" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Carregando eventos...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-16 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <CalendarDaysIcon className="h-7 w-7 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                  Nenhum evento encontrado. Crie seu primeiro evento para organizar o cronograma da unidade.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((evento) => {
                  const tipo = getTipo(evento.tipo);
                  return (
                    <div
                      key={evento.id}
                      className={`${cardClass} group flex flex-col sm:flex-row sm:items-start gap-4 p-5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600`}
                    >
                      {/* Color stripe + date */}
                      <div className="flex sm:flex-col items-center gap-3 sm:gap-1 sm:min-w-[80px] sm:text-center shrink-0">
                        <div className={`h-2 w-2 rounded-full ${tipo.color} shrink-0 sm:mx-auto`} />
                        <div>
                          <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                            {new Date(evento.inicio).getDate()}
                          </p>
                          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                            {new Date(evento.inicio).toLocaleDateString('pt-BR', { month: 'short' })}
                          </p>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start gap-2 mb-1">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            {evento.titulo}
                          </h3>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tipo.light}`}>
                            {tipo.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="h-3.5 w-3.5" />
                            {evento.dia_inteiro
                              ? `${formatDate(evento.inicio)}${evento.fim ? ` - ${formatDate(evento.fim)}` : ''} (dia inteiro)`
                              : `${formatDateTime(evento.inicio)}${evento.fim ? ` - ${formatTime(evento.fim)}` : ''}`
                            }
                          </span>
                          {evento.local && (
                            <span className="inline-flex items-center gap-1">
                              <MapPinIcon className="h-3.5 w-3.5" />
                              {evento.local}
                            </span>
                          )}
                          {evento.recorrencia !== 'NONE' && (
                            <span className="inline-flex items-center gap-1">
                              <ArrowPathIcon className="h-3.5 w-3.5" />
                              {RECORRENCIA_OPTIONS.find((r) => r.value === evento.recorrencia)?.label}
                              {evento.recorrencia_intervalo > 1 ? ` (a cada ${evento.recorrencia_intervalo})` : ''}
                            </span>
                          )}
                        </div>

                        {evento.observacoes && (
                          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 flex items-start gap-1">
                            <ChatBubbleLeftIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            {evento.observacoes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(evento)} className={`${btnSecondary} !py-2 !px-3 !text-xs`}>
                          <PencilSquareIcon className="h-4 w-4" />
                          <span className="sm:hidden">Editar</span>
                        </button>
                        <button onClick={() => handleDelete(evento.id)} className={`${btnDanger} !py-2 !px-3 !text-xs`}>
                          <TrashIcon className="h-4 w-4" />
                          <span className="sm:hidden">Remover</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Cronograma;
