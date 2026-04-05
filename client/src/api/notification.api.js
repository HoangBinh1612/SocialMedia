import api from './axios';

export const notificationAPI = {
  getAll: (page = 1, size = 20) => api.get('/notifications', { params: { page, size } }),
  markRead: (id) => api.put('/notifications/' + id + '/read'),
  markAllRead: () => api.put('/notifications/read-all'),
  count: () => api.get('/notifications/count')
};
