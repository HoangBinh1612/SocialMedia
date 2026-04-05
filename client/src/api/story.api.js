import api from './axios';

export const storyAPI = {
  getFeed: () => api.get('/stories'),
  create: (data) => api.post('/stories', data),
  delete: (id) => api.delete('/stories/' + id)
};
