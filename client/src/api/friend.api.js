import api from './axios';

export const friendAPI = {
  getPending: () => api.get('/friends/requests/pending'),
  getList: () => api.get('/friends/list'),
  getSuggestions: (limit = 10) => api.get('/friends/suggestions', { params: { limit } }),
  send: (targetUserId) => api.post('/friends/send/' + targetUserId),
  accept: (fromUserId) => api.post('/friends/' + fromUserId + '/accept'),
  reject: (fromUserId) => api.post('/friends/' + fromUserId + '/reject'),
  remove: (friendUserId) => api.delete('/friends/' + friendUserId),
  block: (targetUserId) => api.post('/friends/' + targetUserId + '/block'),
  getStatus: (targetUserId) => api.get('/friends/' + targetUserId + '/status'),
  getProfileFriends: (userId) => api.get('/friends/profile/' + userId)
};
