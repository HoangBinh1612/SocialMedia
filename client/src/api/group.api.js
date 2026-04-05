import api from './axios';

export const groupAPI = {
  getMyGroups: () => api.get('/groups'),
  getDetails: (id) => api.get(`/groups/${id}`),
  createGroup: (data) => api.post('/groups', data),
  addMembers: (id, members) => api.post(`/groups/${id}/add-members`, { members }),
  leaveGroup: (id) => api.post(`/groups/${id}/leave`),
  deleteGroup: (id) => api.delete(`/groups/${id}`)
};
