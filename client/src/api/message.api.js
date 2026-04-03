import api from './axios';

export const messageAPI = {
  getConversation: (otherId, page = 1) => api.get('/messages/with/' + otherId, { params: { page } }),
  send: (otherId, data) => api.post('/messages/to/' + otherId, data),
  sendMedia: (formData) => api.post('/messages/send-media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getGroupConversation: (groupId, page = 1) => api.get('/messages/group/' + groupId, { params: { page } }),
  sendGroup: (groupId, data) => api.post('/messages/group/' + groupId, data),
  markRead: (id) => api.put('/messages/' + id + '/read'),
  markAllRead: (otherUserId) => api.put('/messages/mark-read-from/' + otherUserId),
  markGroupRead: (groupId) => api.put('/messages/mark-read-group/' + groupId),
  unreadCount: () => api.get('/messages/unread-count'),
  unreadList: () => api.get('/messages/unread-list'),
  recent: () => api.get('/messages/recent')
};
