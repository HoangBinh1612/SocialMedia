import api from './axios';

export const reactionAPI = {
  react: (postId, type) => api.post('/posts/' + postId + '/react?type=' + type),
  unreact: (postId) => api.delete('/posts/' + postId + '/react'),
  count: (postId) => api.get('/posts/' + postId + '/reactions/count'),
  myReaction: (postId) => api.get('/posts/' + postId + '/reactions/me'),
  getAll: (postId) => api.get('/posts/' + postId + '/reactions')
};
