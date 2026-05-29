import { useState, useEffect } from 'react';
import { useNotifications } from '../components/ui/Notifications';
import { suporteFeedbackService } from '../services/suporteFeedbackService';
import {
  ChevronDownIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  InboxIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const assuntoLabel = { duvida: 'Dúvida', sugestao: 'Sugestão', problema: 'Problema Técnico' };
const assuntoBadge = {
  duvida: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  sugestao: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  problema: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const formatarData = (dateStr) =>
  new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ─── Dados mock do FAQ ───────────────────────────────────────────────
const faqItems = [
  {
    pergunta: 'Como marco uma consulta pelo sistema?',
    resposta:
      'Acesse o módulo "Marcação de Serviços" no painel principal. Escolha a especialidade desejada, selecione o profissional disponível e confirme o horário. Você receberá uma confirmação na tela e poderá acompanhar o status pela aba "Minhas Consultas".',
  },
  {
    pergunta: 'Como altero ou recupero minha senha?',
    resposta:
      'Atualmente a alteração de senha pode ser solicitada diretamente na recepção da sua UBS. Em breve disponibilizaremos a funcionalidade de recuperação por e-mail diretamente pelo sistema.',
  },
  {
    pergunta: 'Quem pode visualizar meus relatórios de saúde?',
    resposta:
      'Seus relatórios são acessíveis apenas pelos profissionais de saúde vinculados ao seu atendimento e pelo gestor da unidade. Pacientes podem visualizar apenas os próprios dados. Todo acesso segue as diretrizes da LGPD.',
  },
  {
    pergunta: 'O que faço se encontrar um erro no sistema?',
    resposta:
      'Utilize o formulário de contato abaixo selecionando o assunto "Problema Técnico". Descreva o erro com o máximo de detalhes possível (tela em que ocorreu, mensagem exibida, etc.) para que possamos resolver rapidamente.',
  },
  {
    pergunta: 'Posso acessar o sistema pelo celular?',
    resposta:
      'Sim! O sistema é totalmente responsivo e pode ser acessado pelo navegador do seu celular ou tablet. Basta abrir o mesmo endereço utilizado no computador. Não é necessário instalar nenhum aplicativo.',
  },
];

// ─── Componente AccordionItem ────────────────────────────────────────
// Cada item do FAQ: ao clicar, expande/recolhe a resposta com transição suave.
// O estado "aberto/fechado" é controlado pelo componente pai via props.
const AccordionItem = ({ pergunta, resposta, isOpen, onToggle }) => {
  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors duration-150"
      >
        <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
          {pergunta}
        </span>
        <ChevronDownIcon
          className={`h-5 w-5 flex-shrink-0 text-gray-500 dark:text-slate-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Grid trick para animar altura de 0 → auto com transição CSS */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-4 pt-1 text-sm text-gray-600 dark:text-slate-400 leading-relaxed border-t border-gray-100 dark:border-slate-700">
            {resposta}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Componente Principal ────────────────────────────────────────────
const SuporteFeedback = () => {
  const { notify } = useNotifications();

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();
  const isGestor = (currentUser?.role || 'USER').toUpperCase() === 'GESTOR';

  // Estado do FAQ: qual item está aberto (-1 = nenhum)
  const [openFaq, setOpenFaq] = useState(-1);

  // Estado do formulário de feedback
  const [form, setForm] = useState({
    assunto: '',
    mensagem: '',
  });
  const [enviando, setEnviando] = useState(false);

  // Estado da caixa de mensagens (só GESTOR)
  const [feedbacks, setFeedbacks] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [atualizando, setAtualizando] = useState(null);

  useEffect(() => {
    if (!isGestor) return;
    setCarregando(true);
    suporteFeedbackService
      .listarFeedbacks()
      .then(setFeedbacks)
      .catch(() => notify({ type: 'error', message: 'Erro ao carregar mensagens recebidas.' }))
      .finally(() => setCarregando(false));
  }, [isGestor]);

  const handleToggleStatus = async (fb) => {
    const novoStatus = fb.status === 'PENDENTE' ? 'LIDA' : 'PENDENTE';
    setAtualizando(fb.id);
    try {
      const atualizado = await suporteFeedbackService.atualizarStatus(fb.id, novoStatus);
      setFeedbacks((prev) => prev.map((f) => (f.id === fb.id ? atualizado : f)));
    } catch {
      notify({ type: 'error', message: 'Erro ao atualizar status da mensagem.' });
    } finally {
      setAtualizando(null);
    }
  };

  // Alterna o item do FAQ clicado (fecha se já estiver aberto)
  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? -1 : index));
  };

  // Atualiza campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Envia o formulário para o backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.assunto) {
      notify({ type: 'warning', message: 'Por favor, selecione um assunto.' });
      return;
    }
    if (!form.mensagem.trim()) {
      notify({ type: 'warning', message: 'Por favor, escreva sua mensagem.' });
      return;
    }

    setEnviando(true);

    try {
      await suporteFeedbackService.enviarFeedback({
        assunto: form.assunto,
        mensagem: form.mensagem.trim(),
      });
      setForm({ assunto: '', mensagem: '' });
      notify({
        type: 'success',
        message: 'Mensagem enviada com sucesso! Obrigado pelo seu feedback.',
        duration: 5000,
      });
    } catch (err) {
      notify({
        type: 'error',
        message: 'Erro ao enviar mensagem. Tente novamente.',
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Cabeçalho da página ─────────────────────────────────── */}
      <div className="mb-8 rise-fade">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Suporte e Feedback
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
          Tire suas dúvidas ou envie sugestões para melhorarmos o sistema.
        </p>
      </div>

      {/* ── Layout responsivo: FAQ + Formulário ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ═══ Seção FAQ ═══ */}
        <section className="rise-fade stagger-1">
          <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg overflow-hidden">
            {/* Header da seção */}
            <div className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Perguntas Frequentes
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Clique em uma pergunta para ver a resposta
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de itens do accordion */}
            <div className="p-4 space-y-3">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  pergunta={item.pergunta}
                  resposta={item.resposta}
                  isOpen={openFaq === index}
                  onToggle={() => toggleFaq(index)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Seção Formulário de Feedback ═══ */}
        <section className="rise-fade stagger-2">
          <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg overflow-hidden">
            {/* Header da seção */}
            <div className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Envie sua Mensagem
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Dúvidas, sugestões ou relatos de problemas
                  </p>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Campo: Assunto (dropdown) */}
              <div>
                <label
                  htmlFor="assunto"
                  className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
                >
                  Assunto <span className="text-red-500">*</span>
                </label>
                <select
                  id="assunto"
                  name="assunto"
                  value={form.assunto}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Selecione um assunto...</option>
                  <option value="duvida">Dúvida</option>
                  <option value="sugestao">Sugestão</option>
                  <option value="problema">Problema Técnico</option>
                </select>
              </div>

              {/* Campo: Mensagem (textarea) */}
              <div>
                <label
                  htmlFor="mensagem"
                  className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
                >
                  Mensagem <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="mensagem"
                  name="mensagem"
                  value={form.mensagem}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Descreva sua dúvida, sugestão ou problema..."
                  className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm text-sm text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                />
              </div>

              {/* Botão de envio */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={enviando}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 px-6 rounded-lg transition-colors duration-200 text-sm"
                >
                  {enviando ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4" />
                      Enviar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {/* ── Seção de Mensagens Recebidas (apenas GESTOR) ─────────── */}
      {isGestor && (
        <section className="mt-8 rise-fade stagger-3">
          <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <InboxIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Mensagens Recebidas
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Mensagens enviadas pelos usuários do sistema
                  </p>
                </div>
                <span className="ml-auto text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2.5 py-1 rounded-full">
                  {feedbacks.length} {feedbacks.length === 1 ? 'mensagem' : 'mensagens'}
                </span>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-4">
              {carregando ? (
                <div className="flex items-center justify-center py-12 gap-3 text-gray-500 dark:text-slate-400">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm">Carregando mensagens...</span>
                </div>
              ) : feedbacks.length === 0 ? (
                <p className="text-center text-sm text-gray-500 dark:text-slate-400 py-10">
                  Nenhuma mensagem recebida ainda.
                </p>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        fb.status === 'PENDENTE'
                          ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {/* Linha superior: usuário + data + assunto + status */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                          {fb.nome_usuario || 'Usuário desconhecido'}
                        </span>
                        {fb.email_usuario && (
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            ({fb.email_usuario})
                          </span>
                        )}
                        <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">
                          {formatarData(fb.created_at)}
                        </span>
                      </div>

                      {/* Badge assunto */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${assuntoBadge[fb.assunto] || 'bg-gray-100 text-gray-600'}`}>
                          {assuntoLabel[fb.assunto] || fb.assunto}
                        </span>
                        {fb.status === 'PENDENTE' ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                            <ClockIcon className="h-3.5 w-3.5" /> Pendente
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="h-3.5 w-3.5" /> Lida
                          </span>
                        )}
                      </div>

                      {/* Mensagem */}
                      <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {fb.mensagem}
                      </p>

                      {/* Botão toggle status */}
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => handleToggleStatus(fb)}
                          disabled={atualizando === fb.id}
                          className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                            fb.status === 'PENDENTE'
                              ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400'
                              : 'bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 disabled:opacity-50'
                          }`}
                        >
                          {atualizando === fb.id
                            ? 'Salvando...'
                            : fb.status === 'PENDENTE'
                            ? 'Marcar como Lida'
                            : 'Marcar como Pendente'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default SuporteFeedback;
