import { useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

/* ─── helpers ─── */

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** Chave AAAA-MM local, usada para agrupar por mês de registro. */
const monthKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'sem-data';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (key) => {
  if (key === 'sem-data') return 'Sem data de registro';
  const [ano, mes] = key.split('-');
  const date = new Date(Number(ano), Number(mes) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const gutTone = (score) => {
  if (score >= 80) return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
  if (score >= 40) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
  return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
};

const STATUS_FILTERS = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ATIVO', label: 'Ativos' },
  { value: 'RESOLVIDO', label: 'Resolvidos' },
];

const ORDER_OPTIONS = [
  { value: 'recentes', label: 'Registro mais recente' },
  { value: 'antigos', label: 'Registro mais antigo' },
  { value: 'gut', label: 'Maior GUT' },
  { value: 'atualizados', label: 'Última atualização' },
];

const inputClass =
  'w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

/* ─── linha do histórico ─── */

const ProblemRow = ({ problema, interventions, isLoading, isOpen, onToggle }) => {
  const resolvido = problema.status === 'RESOLVIDO';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
      >
        <span className="mt-0.5 text-slate-400 dark:text-slate-500">
          {isOpen ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`text-sm font-semibold ${
              resolvido
                ? 'text-slate-500 line-through dark:text-slate-400'
                : 'text-slate-900 dark:text-white'
            }`}>
              {problema.titulo}
            </h3>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              resolvido
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
            }`}>
              {resolvido ? 'Resolvido' : 'Ativo'}
            </span>
            {problema.is_prioritario && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Prioritário
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${gutTone(problema.gut_score)}`}>
              GUT {problema.gut_score}
            </span>
          </div>

          {problema.descricao && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
              {problema.descricao}
            </p>
          )}

          <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex gap-1">
              <dt>Registrado em:</dt>
              <dd className="font-medium tabular-nums text-slate-700 dark:text-slate-300">
                {formatDateTime(problema.created_at)}
              </dd>
            </div>
            <div className="flex gap-1">
              <dt>Última atualização:</dt>
              <dd className="font-medium tabular-nums text-slate-700 dark:text-slate-300">
                {problema.updated_at ? formatDateTime(problema.updated_at) : 'nunca editado'}
              </dd>
            </div>
            <div className="flex gap-1">
              <dt>GUT:</dt>
              <dd className="tabular-nums">
                G{problema.gut_gravidade} · U{problema.gut_urgencia} · T{problema.gut_tendencia}
              </dd>
            </div>
          </dl>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          {isLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-slate-500 dark:text-slate-400">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Carregando intervenções...
            </div>
          ) : !interventions || interventions.length === 0 ? (
            <p className="py-1 text-xs text-slate-500 dark:text-slate-400">
              Nenhuma intervenção registrada para este problema.
            </p>
          ) : (
            <ol className="space-y-2">
              {interventions.map((intervencao) => (
                <li
                  key={intervencao.id}
                  className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      {intervencao.status}
                    </span>
                    {intervencao.responsavel && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Responsável: {intervencao.responsavel}
                      </span>
                    )}
                    <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                      criada em {formatDate(intervencao.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-200">{intervencao.objetivo}</p>
                  {intervencao.metas && (
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Metas: {intervencao.metas}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── painel principal ─── */

const HistoricoProblemas = ({ problems, loading, onLoadInterventions }) => {
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('TODOS');
  const [ordem, setOrdem] = useState('recentes');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [abertos, setAbertos] = useState({});
  const [intervencoesPorProblema, setIntervencoesPorProblema] = useState({});
  const [carregando, setCarregando] = useState({});

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    // Datas dos filtros são interpretadas em hora local, cobrindo o dia inteiro.
    const inicioFiltro = de ? new Date(`${de}T00:00:00`) : null;
    const fimFiltro = ate ? new Date(`${ate}T23:59:59`) : null;

    const resultado = problems.filter((problema) => {
      if (statusFiltro !== 'TODOS' && problema.status !== statusFiltro) return false;

      if (termo) {
        const alvo = `${problema.titulo || ''} ${problema.descricao || ''}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }

      if (inicioFiltro || fimFiltro) {
        const criado = problema.created_at ? new Date(problema.created_at) : null;
        if (!criado || Number.isNaN(criado.getTime())) return false;
        if (inicioFiltro && criado < inicioFiltro) return false;
        if (fimFiltro && criado > fimFiltro) return false;
      }

      return true;
    });

    const porData = (valor) => {
      const data = valor ? new Date(valor).getTime() : 0;
      return Number.isNaN(data) ? 0 : data;
    };

    return [...resultado].sort((a, b) => {
      if (ordem === 'gut') return (b.gut_score || 0) - (a.gut_score || 0);
      if (ordem === 'antigos') return porData(a.created_at) - porData(b.created_at);
      if (ordem === 'atualizados') {
        return porData(b.updated_at || b.created_at) - porData(a.updated_at || a.created_at);
      }
      return porData(b.created_at) - porData(a.created_at);
    });
  }, [problems, busca, statusFiltro, ordem, de, ate]);

  // Agrupa por mês de registro apenas nas ordenações cronológicas, onde o
  // agrupamento faz sentido; por GUT a sequência de meses ficaria embaralhada.
  const agrupado = useMemo(() => {
    if (ordem === 'gut') return null;
    const grupos = new Map();
    filtrados.forEach((problema) => {
      const key = monthKey(problema.created_at);
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key).push(problema);
    });
    return Array.from(grupos.entries());
  }, [filtrados, ordem]);

  const toggle = async (problema) => {
    const aberto = !!abertos[problema.id];
    setAbertos((prev) => ({ ...prev, [problema.id]: !aberto }));
    if (aberto || intervencoesPorProblema[problema.id] || !onLoadInterventions) return;

    setCarregando((prev) => ({ ...prev, [problema.id]: true }));
    try {
      const dados = await onLoadInterventions(problema.id);
      setIntervencoesPorProblema((prev) => ({
        ...prev,
        [problema.id]: Array.isArray(dados) ? dados : [],
      }));
    } catch {
      setIntervencoesPorProblema((prev) => ({ ...prev, [problema.id]: [] }));
    } finally {
      setCarregando((prev) => ({ ...prev, [problema.id]: false }));
    }
  };

  const temFiltro = busca || statusFiltro !== 'TODOS' || de || ate;
  const limparFiltros = () => {
    setBusca('');
    setStatusFiltro('TODOS');
    setDe('');
    setAte('');
  };

  const resolvidos = problems.filter((p) => p.status === 'RESOLVIDO').length;

  return (
    <section className="mt-8 space-y-5 rise-fade stagger-1">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <ClipboardDocumentListIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Histórico de problemas
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {problems.length} registrado{problems.length !== 1 ? 's' : ''} · {resolvidos} resolvido{resolvidos !== 1 ? 's' : ''}
              {filtrados.length !== problems.length && ` · ${filtrados.length} no filtro atual`}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Buscar
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Título ou descrição..."
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Situação
            </label>
            <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className={inputClass}>
              {STATUS_FILTERS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Registrado de
            </label>
            <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              até
            </label>
            <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Ordenar por
            </label>
            <select value={ordem} onChange={(e) => setOrdem(e.target.value)} className={`${inputClass} sm:w-56`}>
              {ORDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {temFiltro && (
            <button
              type="button"
              onClick={limparFiltros}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <XMarkIcon className="h-4 w-4" /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Resultado */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Carregando histórico...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-16 text-center dark:border-slate-700">
          <ClipboardDocumentListIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
            {problems.length === 0
              ? 'Nenhum problema foi registrado nesta unidade até agora.'
              : 'Nenhum problema corresponde aos filtros aplicados.'}
          </p>
        </div>
      ) : agrupado ? (
        <div className="space-y-6">
          {agrupado.map(([key, itens]) => (
            <div key={key}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 first-letter:uppercase dark:text-slate-500">
                {monthLabel(key)} · {itens.length}
              </h3>
              <div className="space-y-2">
                {itens.map((problema) => (
                  <ProblemRow
                    key={problema.id}
                    problema={problema}
                    interventions={intervencoesPorProblema[problema.id]}
                    isLoading={!!carregando[problema.id]}
                    isOpen={!!abertos[problema.id]}
                    onToggle={() => toggle(problema)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((problema) => (
            <ProblemRow
              key={problema.id}
              problema={problema}
              interventions={intervencoesPorProblema[problema.id]}
              isLoading={!!carregando[problema.id]}
              isOpen={!!abertos[problema.id]}
              onToggle={() => toggle(problema)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HistoricoProblemas;
