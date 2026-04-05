import api from './axios';

export const communityAPI = {
  getCommunities: () => api.get('/communities'),
  createCommunity: (data) => api.post('/communities', data),
  getCommunity: (id) => api.get(`/communities/${id}`),
  joinCommunity: (id) => api.post(`/communities/${id}/join`),
  getRequests: (id) => api.get(`/communities/${id}/requests`),
  approveRequest: (id, userId) => api.put(`/communities/${id}/approve/${userId}`),
  getPosts: (id) => api.get(`/communities/${id}/posts`),
  createPost: (id, data) => api.post(`/communities/${id}/posts`, data),
  leaveCommunity: (id) => api.post(`/communities/${id}/leave`),
  deleteCommunity: (id) => api.delete(`/communities/${id}`),
  updateCover: (id, coverUrl) => api.put(`/communities/${id}/cover`, { coverUrl }),
  updatePrivacy: (id, privacy) => api.put(`/communities/${id}/privacy`, { privacy })
};
