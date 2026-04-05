import api from './axios';

export const postAPI = {
  create: (data) => api.post('/posts', data),
  getFeed: (page = 1, size = 20) => api.get('/posts/feed', { params: { page, size } }),
  getMyPosts: () => api.get('/posts/me'),
  getById: (id) => api.get('/posts/' + id),
  getByUser: (userId) => api.get('/posts/profile/' + userId),
  update: (id, data) => api.put('/posts/' + id, data),
  delete: (id) => api.delete('/posts/' + id)
};
