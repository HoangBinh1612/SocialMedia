import api from './axios';

export const profileAPI = {
  getMe: () => api.get('/profile/me'),
  getUser: (userId) => api.get('/profile/' + userId),
  updateMe: (data) => api.put('/profile/me', data),
  changePassword: (data) => api.put('/profile/me/password', data)
};
