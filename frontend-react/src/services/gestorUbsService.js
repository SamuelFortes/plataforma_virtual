import { api } from './api';

export const gestorUbsService = {
  listAll: async () => {
    const data = await api.request('/gestor/ubs', { requiresAuth: true });
    if (!Array.isArray(data)) {
      console.error('[gestorUbsService] Resposta inesperada de /gestor/ubs:', data);
      throw new Error('Resposta inválida do servidor. Verifique se o backend foi reiniciado após o deploy.');
    }
    return data;
  },

  remove: async (ubsId) => {
    return api.request(`/gestor/ubs/${ubsId}`, { method: 'DELETE', requiresAuth: true });
  },

  setActive: async (ubsId) => {
    return api.request(`/gestor/ubs/${ubsId}/set-active`, { method: 'PATCH', requiresAuth: true });
  },
};
