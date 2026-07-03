import { api } from './api';

export const suporteFeedbackService = {
  enviarFeedback: (payload) =>
    api.request('/suporte-feedback', { method: 'POST', body: payload, requiresAuth: true }),

  listarFeedbacks: () =>
    api.request('/suporte-feedback', { requiresAuth: true }),

  encerrarFeedback: (id, encerrado) =>
    api.request(`/suporte-feedback/${id}/encerrar`, {
      method: 'PATCH',
      body: { encerrado },
      requiresAuth: true,
    }),

  listarMensagens: (feedbackId) =>
    api.request(`/suporte-feedback/${feedbackId}/mensagens`, { requiresAuth: true }),

  enviarMensagem: (feedbackId, conteudo) =>
    api.request(`/suporte-feedback/${feedbackId}/mensagens`, {
      method: 'POST',
      body: { conteudo },
      requiresAuth: true,
    }),

  // mantido para compatibilidade
  atualizarStatus: (id, status) =>
    api.request(`/suporte-feedback/${id}`, { method: 'PATCH', body: { status }, requiresAuth: true }),
};
