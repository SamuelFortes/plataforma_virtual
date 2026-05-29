import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../components/ui/Notifications';
import { suporteFeedbackService } from '../services/suporteFeedbackService';
import {
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
  LockClosedIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';

/* ─── helpers ─── */
const assuntoLabel = { duvida: 'Dúvida', sugestao: 'Sugestão', problema: 'Problema Técnico' };
const assuntoBadge = {
  duvida:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  sugestao: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  problema: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const fmtDate = (d) =>
  new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const fmtDateShort = (d) =>
  new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/* ─── FAQ ─── */
const faqItems = [
  {
    pergunta: 'Como faço para agendar uma consulta?',
    resposta: 'Acesse a aba "Agendamento" no menu lateral. Escolha o serviço, o profissional disponível e o horário de sua preferência.',
  },
  {
    pergunta: 'Esqueci minha senha. Como recupero?',
    resposta: 'Na tela de login, clique em "Esqueci minha senha". Você receberá um e-mail com as instruções para redefinição.',
  },
  {
    pergunta: 'Como altero meus dados cadastrais?',
    resposta: 'Acesse "Configurações" no menu do perfil (canto superior direito) e edite seus dados pessoais.',
  },
  {
    pergunta: 'Quanto tempo leva para meu chamado ser respondido?',
    resposta: 'Nossa equipe procura responder em até 24 horas em dias úteis. Chamados marcados como urgentes têm prioridade.',
  },
  {
    pergunta: 'Posso reabrir um chamado encerrado?',
    resposta: 'Sim. Abra o chamado encerrado e clique em "Reabrir chamado". O chat voltará a aceitar mensagens.',
  },
];

const FaqAccordion = () => {
  const [open, setOpen] = useState(-1);
  return (
    <div className="space-y-2">
      {faqItems.map((item, i) => (
        <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.pergunta}</span>
            <ChevronDownIcon className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && (
            <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.resposta}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ─── chat bubble ─── */
const ChatBubble = ({ conteudo, nomeAutor, roleAutor, createdAt, isOwn }) => (
  <div className={`flex flex-col mb-3 ${isOwn ? 'items-end' : 'items-start'}`}>
    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 px-1">
      {nomeAutor || 'Usuário'}
      {roleAutor === 'GESTOR' && (
        <span className="ml-1.5 text-[10px] bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 px-1.5 py-0.5 rounded-full font-semibold">
          Gestor
        </span>
      )}
    </span>
    <div
      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
        isOwn
          ? 'rounded-br-sm bg-cyan-600 text-white'
          : 'rounded-bl-sm bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
      }`}
    >
      {conteudo}
    </div>
    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 px-1">{fmtDateShort(createdAt)}</span>
  </div>
);

/* ─── componente principal ─── */
const SuporteFeedback = () => {
  const { notify } = useNotifications();
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const isGestor = (currentUser?.role || 'USER').toUpperCase() === 'GESTOR';

  const [showNovoForm, setShowNovoForm] = useState(false);
  const [novoForm, setNovoForm] = useState({ assunto: 'duvida', mensagem: '' });
  const [enviandoNovo, setEnviandoNovo] = useState(false);

  const [feedbacks, setFeedbacks] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [expandedId, setExpandedId] = useState(null);
  const [mensagensMap, setMensagensMap] = useState({});
  const [loadingMsgsId, setLoadingMsgsId] = useState(null);
  const [inputMsg, setInputMsg] = useState('');
  const [enviandoMsg, setEnviandoMsg] = useState(false);

  const [showFaq, setShowFaq] = useState(false);

  const chatBottomRef = useRef(null);

  useEffect(() => { loadFeedbacks(); }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagensMap, expandedId]);

  const loadFeedbacks = async () => {
    setCarregando(true);
    try {
      const data = await suporteFeedbackService.listarFeedbacks();
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch {
      notify({ type: 'error', message: 'Erro ao carregar chamados.' });
    } finally {
      setCarregando(false);
    }
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setInputMsg('');
      return;
    }
    setExpandedId(id);
    setInputMsg('');
    if (!mensagensMap[id]) {
      setLoadingMsgsId(id);
      try {
        const data = await suporteFeedbackService.listarMensagens(id);
        setMensagensMap((prev) => ({ ...prev, [id]: Array.isArray(data) ? data : [] }));
      } catch {
        notify({ type: 'error', message: 'Erro ao carregar mensagens.' });
      } finally {
        setLoadingMsgsId(null);
      }
    }
  };

  const handleEnviarMensagem = async (feedbackId) => {
    const texto = inputMsg.trim();
    if (!texto || enviandoMsg) return;
    setEnviandoMsg(true);
    try {
      const msg = await suporteFeedbackService.enviarMensagem(feedbackId, texto);
      setMensagensMap((prev) => ({
        ...prev,
        [feedbackId]: [...(prev[feedbackId] || []), msg],
      }));
      setInputMsg('');
    } catch {
      notify({ type: 'error', message: 'Erro ao enviar mensagem.' });
    } finally {
      setEnviandoMsg(false);
    }
  };

  const handleEncerrar = async (feedbackId, encerrado) => {
    try {
      const updated = await suporteFeedbackService.encerrarFeedback(feedbackId, encerrado);
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === feedbackId ? { ...f, encerrado: updated.encerrado } : f))
      );
    } catch {
      notify({ type: 'error', message: 'Erro ao atualizar chamado.' });
    }
  };

  const handleEnviarNovo = async (e) => {
    e.preventDefault();
    if (!novoForm.mensagem.trim()) return;
    setEnviandoNovo(true);
    try {
      const novo = await suporteFeedbackService.enviarFeedback({
        assunto: novoForm.assunto,
        mensagem: novoForm.mensagem.trim(),
      });
      setFeedbacks((prev) => [novo, ...prev]);
      setNovoForm({ assunto: 'duvida', mensagem: '' });
      setShowNovoForm(false);
      notify({ type: 'success', message: 'Chamado aberto com sucesso.' });
    } catch {
      notify({ type: 'error', message: 'Erro ao abrir chamado.' });
    } finally {
      setEnviandoNovo(false);
    }
  };

  const handleKeyDown = (e, feedbackId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensagem(feedbackId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10 space-y-6">

        {/* cabeçalho */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-900/40">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Suporte e Feedback</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isGestor ? 'Gerencie todos os chamados abertos' : 'Envie dúvidas e acompanhe seus chamados'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNovoForm((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              showNovoForm
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm'
            }`}
          >
            {showNovoForm
              ? <><XMarkIcon className="h-4 w-4" /> Cancelar</>
              : <><PlusIcon className="h-4 w-4" /> Novo chamado</>}
          </button>
        </div>

        {/* formulário novo chamado */}
        {showNovoForm && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm rise-fade">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Abrir novo chamado</h2>
            <form onSubmit={handleEnviarNovo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                  Assunto
                </label>
                <select
                  value={novoForm.assunto}
                  onChange={(e) => setNovoForm((p) => ({ ...p, assunto: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                >
                  <option value="duvida">Dúvida</option>
                  <option value="sugestao">Sugestão</option>
                  <option value="problema">Problema Técnico</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                  Descrição
                </label>
                <textarea
                  rows={4}
                  required
                  value={novoForm.mensagem}
                  onChange={(e) => setNovoForm((p) => ({ ...p, mensagem: e.target.value }))}
                  placeholder="Descreva sua dúvida ou problema com o máximo de detalhes..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={enviandoNovo}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                  {enviandoNovo ? 'Enviando...' : 'Enviar chamado'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* lista de chamados */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <InboxIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {isGestor ? 'Todos os chamados' : 'Meus chamados'}
            </h2>
          </div>

          {carregando ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="ml-auto h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                  <div className="mt-3 h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isGestor ? 'Nenhum chamado recebido ainda.' : 'Você não possui chamados.'}
              </p>
              {!isGestor && (
                <button
                  onClick={() => setShowNovoForm(true)}
                  className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                >
                  Abrir primeiro chamado
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((fb) => {
                const isExpanded = expandedId === fb.id;
                const msgs = mensagensMap[fb.id] || [];
                const isLoadingMsgs = loadingMsgsId === fb.id;
                const canClose = isGestor || fb.usuario_id === currentUser?.id;

                return (
                  <div
                    key={fb.id}
                    className={`rounded-2xl border transition-all overflow-hidden bg-white dark:bg-slate-900 ${
                      isExpanded
                        ? 'border-cyan-300 dark:border-cyan-700 shadow-md shadow-cyan-500/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {/* cabeçalho do ticket */}
                    <button
                      onClick={() => toggleExpand(fb.id)}
                      className="flex w-full items-start gap-3 px-4 py-4 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${assuntoBadge[fb.assunto] || 'bg-gray-100 text-gray-600'}`}>
                            {assuntoLabel[fb.assunto] || fb.assunto}
                          </span>
                          {fb.encerrado ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                              <CheckCircleIcon className="h-3.5 w-3.5" /> Encerrado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                              <ClockIcon className="h-3.5 w-3.5" /> Aberto
                            </span>
                          )}
                          {isGestor && fb.nome_usuario && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">• {fb.nome_usuario}</span>
                          )}
                          <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto shrink-0">
                            {fmtDate(fb.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1 pr-4">
                          {fb.mensagem}
                        </p>
                      </div>
                      <ChevronDownIcon
                        className={`h-5 w-5 shrink-0 mt-0.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* painel de chat */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 dark:border-slate-700">
                        {/* mensagens */}
                        <div className="px-4 py-4 max-h-72 overflow-y-auto">
                          {/* mensagem inicial (abertura do chamado) */}
                          <ChatBubble
                            conteudo={fb.mensagem}
                            nomeAutor={fb.nome_usuario || 'Você'}
                            roleAutor={null}
                            createdAt={fb.created_at}
                            isOwn={fb.usuario_id === currentUser?.id}
                          />

                          {isLoadingMsgs ? (
                            <div className="flex justify-center py-4">
                              <ArrowPathIcon className="h-5 w-5 animate-spin text-slate-400" />
                            </div>
                          ) : (
                            msgs.map((msg) => (
                              <ChatBubble
                                key={msg.id}
                                conteudo={msg.conteudo}
                                nomeAutor={msg.nome_autor}
                                roleAutor={msg.role_autor}
                                createdAt={msg.created_at}
                                isOwn={msg.autor_id === currentUser?.id}
                              />
                            ))
                          )}
                          <div ref={expandedId === fb.id ? chatBottomRef : null} />
                        </div>

                        {/* input e ações */}
                        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                          {!fb.encerrado ? (
                            <div className="flex gap-2">
                              <textarea
                                rows={2}
                                value={inputMsg}
                                onChange={(e) => setInputMsg(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, fb.id)}
                                placeholder="Digite sua resposta... (Enter para enviar)"
                                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition resize-none"
                              />
                              <button
                                onClick={() => handleEnviarMensagem(fb.id)}
                                disabled={!inputMsg.trim() || enviandoMsg}
                                className="self-end inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white transition-colors"
                              >
                                <PaperAirplaneIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">Enviar</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500">
                              <LockClosedIcon className="h-4 w-4" />
                              Chamado encerrado — não é possível enviar mensagens.
                            </div>
                          )}

                          {canClose && (
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleEncerrar(fb.id, !fb.encerrado)}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                  fb.encerrado
                                    ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                                    : 'bg-green-100 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/60 text-green-700 dark:text-green-300'
                                }`}
                              >
                                {fb.encerrado
                                  ? <><ArrowPathIcon className="h-3.5 w-3.5" /> Reabrir chamado</>
                                  : <><CheckCircleIcon className="h-3.5 w-3.5" /> Encerrar chamado</>}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FAQ colapsável */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <button
            onClick={() => setShowFaq((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <QuestionMarkCircleIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Perguntas frequentes</span>
            </div>
            <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${showFaq ? 'rotate-180' : ''}`} />
          </button>
          {showFaq && (
            <div className="border-t border-slate-200 dark:border-slate-700 px-5 py-4">
              <FaqAccordion />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SuporteFeedback;
