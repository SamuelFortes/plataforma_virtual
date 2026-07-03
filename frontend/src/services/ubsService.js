import { api } from './api';

export const ubsService = {
  getUbsReports: async (page = 1, pageSize = 20) => {
    const data = await api.request(`/ubs?page=${page}&page_size=${pageSize}`, { requiresAuth: true });
    return data?.items || [];
  },

  getSingleUbs: async () => {
    const data = await api.request('/ubs?page=1&page_size=1', { requiresAuth: true });
    const items = data?.items || [];
    return items[0] || null;
  },
};
