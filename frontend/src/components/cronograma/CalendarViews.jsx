import { useMemo, useRef, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/* ─── constantes ─── */

export const VIEW_MODES = [
  { value: 'dia', label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
  { value: 'lista', label: 'Lista' },
];

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const HOUR_HEIGHT = 48; // px por hora nas grades de dia/semana
const MINUTES_IN_DAY = 24 * 60;

/* ─── helpers de data (todos em hora local) ─── */

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const addMonths = (date, n) => new Date(date.getFullYear(), date.getMonth() + n, 1);
const startOfWeek = (date) => addDays(date, -date.getDay());
const sameDay = (a, b) => a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const minutesOfDay = (date) => date.getHours() * 60 + date.getMinutes();

/** Rótulo do período visível, no formato que o Google Agenda usa. */
export const rangeLabel = (view, cursor) => {
  if (view === 'dia') {
    return cursor.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
  }
  if (view === 'semana') {
    const first = startOfWeek(cursor);
    const last = addDays(first, 6);
    const sameMonth = first.getMonth() === last.getMonth();
    const firstLabel = first.toLocaleDateString('pt-BR', sameMonth
      ? { day: '2-digit' }
      : { day: '2-digit', month: 'short' });
    const lastLabel = last.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    return `${firstLabel} – ${lastLabel} de ${last.getFullYear()}`;
  }
  return `${MONTHS[cursor.getMonth()]} de ${cursor.getFullYear()}`;
};

/** Move o cursor uma unidade da visualização atual para frente ou para trás. */
export const shiftCursor = (view, cursor, direction) => {
  if (view === 'dia') return addDays(cursor, direction);
  if (view === 'semana') return addDays(cursor, direction * 7);
  return addMonths(cursor, direction);
};

/** Intervalo visível [inicio, fim) da visualização — usado para expandir recorrências. */
export const visibleRange = (view, cursor) => {
  if (view === 'dia') {
    const start = startOfDay(cursor);
    return { start, end: addDays(start, 1) };
  }
  if (view === 'semana') {
    const start = startOfWeek(cursor);
    return { start, end: addDays(start, 7) };
  }
  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = startOfWeek(firstOfMonth);
  return { start, end: addDays(start, 42) };
};

/**
 * Gera as ocorrências de um evento dentro do intervalo visível.
 *
 * O backend guarda a regra de recorrência mas devolve apenas a linha original,
 * sem expandir. Sem isso, uma reunião semanal apareceria uma única vez no mês.
 */
const expandOccurrences = (evento, rangeStart, rangeEnd) => {
  const inicio = new Date(evento.inicio);
  if (Number.isNaN(inicio.getTime())) return [];

  const fim = evento.fim ? new Date(evento.fim) : null;
  const duracaoMs = fim && fim > inicio ? fim - inicio : 0;

  const tipoRecorrencia = (evento.recorrencia || 'NONE').toUpperCase();
  const intervalo = Math.max(1, Number(evento.recorrencia_intervalo) || 1);
  // recorrencia_fim é uma data pura (sem hora): interpretamos como fim do dia local.
  const limite = evento.recorrencia_fim
    ? new Date(`${evento.recorrencia_fim}T23:59:59`)
    : null;

  const ocorrencias = [];
  const push = (dataInicio) => {
    const dataFim = duracaoMs > 0 ? new Date(dataInicio.getTime() + duracaoMs) : null;
    ocorrencias.push({ ...evento, _inicio: dataInicio, _fim: dataFim });
  };

  if (tipoRecorrencia === 'NONE') {
    const ocupaFim = duracaoMs > 0 ? new Date(inicio.getTime() + duracaoMs) : inicio;
    if (ocupaFim >= rangeStart && inicio < rangeEnd) push(inicio);
    return ocorrencias;
  }

  // Teto de segurança: evita laço infinito se a regra vier inconsistente.
  const MAX_ITERACOES = 500;
  let atual = new Date(inicio);
  for (let i = 0; i < MAX_ITERACOES; i += 1) {
    if (limite && atual > limite) break;
    if (atual >= rangeEnd) break;

    const ocupaFim = duracaoMs > 0 ? new Date(atual.getTime() + duracaoMs) : atual;
    if (ocupaFim >= rangeStart) push(new Date(atual));

    if (tipoRecorrencia === 'DAILY') {
      atual = new Date(atual.getFullYear(), atual.getMonth(), atual.getDate() + intervalo,
        atual.getHours(), atual.getMinutes());
    } else if (tipoRecorrencia === 'WEEKLY') {
      atual = new Date(atual.getFullYear(), atual.getMonth(), atual.getDate() + intervalo * 7,
        atual.getHours(), atual.getMinutes());
    } else if (tipoRecorrencia === 'MONTHLY') {
      atual = new Date(atual.getFullYear(), atual.getMonth() + intervalo, atual.getDate(),
        atual.getHours(), atual.getMinutes());
    } else {
      break;
    }
  }
  return ocorrencias;
};

/** Todas as ocorrências visíveis, já ordenadas por início. */
export const useOccurrences = (events, view, cursor) => useMemo(() => {
  const { start, end } = visibleRange(view, cursor);
  return events
    .flatMap((evento) => expandOccurrences(evento, start, end))
    .sort((a, b) => a._inicio - b._inicio);
}, [events, view, cursor]);

const occurrencesOfDay = (ocorrencias, dia) => ocorrencias.filter((o) => {
  if (o.dia_inteiro) {
    const inicioDia = startOfDay(o._inicio);
    const fimDia = startOfDay(o._fim || o._inicio);
    return dia >= inicioDia && dia <= fimDia;
  }
  return sameDay(o._inicio, dia);
});

/* ─── barra de navegação ─── */

export const CalendarToolbar = ({ view, cursor, onViewChange, onNavigate, onToday }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToday}
        className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        Hoje
      </button>
      <div className="flex items-center">
        <button
          type="button"
          aria-label="Período anterior"
          onClick={() => onNavigate(-1)}
          className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Período seguinte"
          onClick={() => onNavigate(1)}
          className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white first-letter:uppercase">
        {rangeLabel(view, cursor)}
      </h2>
    </div>

    <div
      role="tablist"
      aria-label="Visualização do calendário"
      className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5"
    >
      {VIEW_MODES.map((mode) => (
        <button
          key={mode.value}
          type="button"
          role="tab"
          aria-selected={view === mode.value}
          onClick={() => onViewChange(mode.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === mode.value
              ? 'bg-blue-600 dark:bg-blue-500 text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  </div>
);

/* ─── chip de evento ─── */

const EventChip = ({ ocorrencia, tipo, onSelect, compact }) => {
  const hora = ocorrencia.dia_inteiro
    ? null
    : ocorrencia._inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return (
    <button
      type="button"
      onClick={() => onSelect?.(ocorrencia)}
      title={`${hora ? `${hora} · ` : ''}${ocorrencia.titulo}`}
      className={`flex w-full items-center gap-1.5 overflow-hidden rounded px-1.5 text-left transition-opacity hover:opacity-80 ${
        compact ? 'py-0.5' : 'py-1'
      } ${tipo.light}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tipo.color}`} />
      {hora && <span className="shrink-0 text-[10px] font-semibold tabular-nums">{hora}</span>}
      <span className="truncate text-[11px] font-medium">{ocorrencia.titulo}</span>
    </button>
  );
};

/* ─── visualização de mês ─── */

export const MonthView = ({ ocorrencias, cursor, getTipo, onSelectEvent, onSelectSlot }) => {
  const { start } = visibleRange('mes', cursor);
  const hoje = startOfDay(new Date());
  const dias = Array.from({ length: 42 }, (_, i) => addDays(start, i));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        {WEEKDAYS_SHORT.map((dia) => (
          <div key={dia} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {dia}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map((dia) => {
          const doMes = dia.getMonth() === cursor.getMonth();
          const eHoje = sameDay(dia, hoje);
          const doDia = occurrencesOfDay(ocorrencias, dia);
          const visiveis = doDia.slice(0, 3);
          const restantes = doDia.length - visiveis.length;

          return (
            <div
              key={dia.toISOString()}
              onClick={() => onSelectSlot?.(dia)}
              className={`min-h-[96px] cursor-pointer border-b border-r border-slate-200 dark:border-slate-700 p-1.5 transition-colors last:border-r-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                doMes ? '' : 'bg-slate-50/60 dark:bg-slate-900/60'
              }`}
            >
              <div className="mb-1 flex justify-end">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  eHoje
                    ? 'bg-blue-600 dark:bg-blue-500 font-bold text-white'
                    : doMes
                      ? 'text-slate-700 dark:text-slate-200'
                      : 'text-slate-400 dark:text-slate-600'
                }`}>
                  {dia.getDate()}
                </span>
              </div>
              <div className="space-y-0.5">
                {visiveis.map((ocorrencia, i) => (
                  <div key={`${ocorrencia.id}-${i}`} onClick={(e) => e.stopPropagation()}>
                    <EventChip
                      ocorrencia={ocorrencia}
                      tipo={getTipo(ocorrencia.tipo)}
                      onSelect={onSelectEvent}
                      compact
                    />
                  </div>
                ))}
                {restantes > 0 && (
                  <p className="px-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    +{restantes} {restantes === 1 ? 'evento' : 'eventos'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── grade de horas (dia e semana) ─── */

const TimeGrid = ({ dias, ocorrencias, getTipo, onSelectEvent, onSelectSlot }) => {
  const scrollRef = useRef(null);
  const hoje = startOfDay(new Date());

  // Abre a grade no horário de trabalho, como o Google Agenda faz.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
  }, []);

  const horas = Array.from({ length: 24 }, (_, h) => h);
  const diaInteiroPorDia = dias.map((dia) => occurrencesOfDay(ocorrencias, dia).filter((o) => o.dia_inteiro));
  const temDiaInteiro = diaInteiroPorDia.some((lista) => lista.length > 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      {/* Cabeçalho com os dias */}
      <div
        className="grid border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
        style={{ gridTemplateColumns: `4rem repeat(${dias.length}, minmax(0, 1fr))` }}
      >
        <div />
        {dias.map((dia) => {
          const eHoje = sameDay(dia, hoje);
          return (
            <div key={dia.toISOString()} className="border-l border-slate-200 dark:border-slate-700 py-2 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {WEEKDAYS_SHORT[dia.getDay()]}
              </p>
              <p className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                eHoje ? 'bg-blue-600 dark:bg-blue-500 font-bold text-white' : 'text-slate-800 dark:text-slate-100'
              }`}>
                {dia.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Faixa de eventos de dia inteiro */}
      {temDiaInteiro && (
        <div
          className="grid border-b border-slate-200 dark:border-slate-700"
          style={{ gridTemplateColumns: `4rem repeat(${dias.length}, minmax(0, 1fr))` }}
        >
          <div className="px-2 py-1.5 text-right text-[10px] font-medium uppercase text-slate-400 dark:text-slate-500">
            Dia inteiro
          </div>
          {dias.map((dia, i) => (
            <div key={dia.toISOString()} className="space-y-0.5 border-l border-slate-200 dark:border-slate-700 p-1">
              {diaInteiroPorDia[i].map((ocorrencia, j) => (
                <EventChip
                  key={`${ocorrencia.id}-${j}`}
                  ocorrencia={ocorrencia}
                  tipo={getTipo(ocorrencia.tipo)}
                  onSelect={onSelectEvent}
                  compact
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Grade de horas */}
      <div ref={scrollRef} className="max-h-[600px] overflow-y-auto">
        <div
          className="relative grid"
          style={{ gridTemplateColumns: `4rem repeat(${dias.length}, minmax(0, 1fr))` }}
        >
          {/* Coluna de horários */}
          <div>
            {horas.map((h) => (
              <div key={h} className="relative border-b border-slate-100 dark:border-slate-800" style={{ height: HOUR_HEIGHT }}>
                <span className="absolute -top-2 right-2 text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                  {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
                </span>
              </div>
            ))}
          </div>

          {/* Uma coluna por dia */}
          {dias.map((dia) => {
            const doDia = occurrencesOfDay(ocorrencias, dia).filter((o) => !o.dia_inteiro);
            return (
              <div key={dia.toISOString()} className="relative border-l border-slate-200 dark:border-slate-700">
                {horas.map((h) => (
                  <div
                    key={h}
                    onClick={() => onSelectSlot?.(new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), h, 0))}
                    className="cursor-pointer border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-blue-50/60 dark:hover:bg-blue-900/20"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}

                {doDia.map((ocorrencia, i) => {
                  const inicioMin = minutesOfDay(ocorrencia._inicio);
                  const fimMin = ocorrencia._fim && ocorrencia._fim > ocorrencia._inicio
                    ? Math.min(MINUTES_IN_DAY, minutesOfDay(ocorrencia._fim) || MINUTES_IN_DAY)
                    : inicioMin + 60;
                  const alturaMin = Math.max(24, fimMin - inicioMin);
                  const tipo = getTipo(ocorrencia.tipo);

                  return (
                    <button
                      key={`${ocorrencia.id}-${i}`}
                      type="button"
                      onClick={() => onSelectEvent?.(ocorrencia)}
                      className={`absolute left-1 right-1 overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-left transition-opacity hover:opacity-85 ${tipo.light}`}
                      style={{
                        top: (inicioMin / 60) * HOUR_HEIGHT,
                        height: (alturaMin / 60) * HOUR_HEIGHT,
                        borderLeftColor: 'currentColor',
                      }}
                    >
                      <p className="truncate text-[11px] font-semibold">{ocorrencia.titulo}</p>
                      <p className="truncate text-[10px] tabular-nums opacity-80">
                        {ocorrencia._inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {ocorrencia._fim && ` – ${ocorrencia._fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const WeekView = ({ ocorrencias, cursor, getTipo, onSelectEvent, onSelectSlot }) => {
  const inicioSemana = startOfWeek(cursor);
  const dias = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));
  return (
    <TimeGrid
      dias={dias}
      ocorrencias={ocorrencias}
      getTipo={getTipo}
      onSelectEvent={onSelectEvent}
      onSelectSlot={onSelectSlot}
    />
  );
};

export const DayView = ({ ocorrencias, cursor, getTipo, onSelectEvent, onSelectSlot }) => (
  <TimeGrid
    dias={[startOfDay(cursor)]}
    ocorrencias={ocorrencias}
    getTipo={getTipo}
    onSelectEvent={onSelectEvent}
    onSelectSlot={onSelectSlot}
  />
);
