import api from './axios';

export const commentAPI = {
  getByPost: (postId) => api.get('/posts/' + postId + '/comments'),
  create: (postId, data) => api.post('/posts/' + postId + '/comments', data),
  update: (postId, commentId, data) => api.put('/posts/' + postId + '/comments/' + commentId, data),
  delete: (postId, commentId) => api.delete('/posts/' + postId + '/comments/' + commentId)
};
