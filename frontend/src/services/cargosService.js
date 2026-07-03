import { api } from './api';

export const cargosService = {
  async listar() {
    return api.request('/cargos');
  },

  async criar(nome) {
    return api.request('/cargos', {
      method: 'POST',
      body: { nome },
      requiresAuth: true,
    });
  },

  async remover(id) {
    return api.request(`/cargos/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  },
};
