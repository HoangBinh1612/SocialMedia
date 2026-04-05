import api from './axios';

export const searchAPI = {
  posts: (q) => api.get('/search/posts', { params: { q } }),
  users: (q) => api.get('/search/users', { params: { q } }),
  communities: (q) => api.get('/search/communities', { params: { q } })
};
