import api from './axios';

export const uploadAPI = {
  image: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  postImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/post', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  avatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  cover: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  media: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

