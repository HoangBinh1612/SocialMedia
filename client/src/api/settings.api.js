import api from './axios';

export const settingsAPI = {
  getPrivacy: () => api.get('/settings/privacy'),
  updatePrivacy: (data) => api.put('/settings/privacy', data)
};
