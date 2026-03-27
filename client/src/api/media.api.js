import api from './axios';

export const mediaAPI = {
  getMyMedia: () => api.get('/media')
};
