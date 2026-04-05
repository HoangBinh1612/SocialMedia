import api from './axios';

export const adminAPI = {
  getUsers: (q = '') => api.get('/admin/users', { params: { q } }),
  banUser: (id) => api.put('/admin/users/' + id + '/ban'),
  unbanUser: (id) => api.put('/admin/users/' + id + '/unban'),
  getPosts: () => api.get('/admin/posts'),
  deletePost: (id) => api.delete('/admin/posts/' + id),
  getComments: () => api.get('/admin/comments'),
  deleteComment: (id) => api.delete('/admin/comments/' + id),
  getCommunities: () => api.get('/admin/communities'),
  deleteCommunity: (id) => api.delete('/admin/communities/' + id),
  getStats: () => api.get('/admin/stats')
};
