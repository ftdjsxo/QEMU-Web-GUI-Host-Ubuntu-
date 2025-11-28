import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// VMs API
export const vmAPI = {
  list: () => api.get('/vms'),
  create: (config) => api.post('/vms', config),
  get: (id) => api.get(`/vms/${id}`),
  delete: (id) => api.delete(`/vms/${id}`),
  start: (id) => api.post(`/vms/${id}/start`),
  stop: (id) => api.post(`/vms/${id}/stop`),
  updateResources: (id, config) => api.patch(`/vms/${id}/resources`, config),
  attachDisk: (id, diskPath) => api.post(`/vms/${id}/disks/attach`, { diskPath }),
  detachDisk: (id, diskPath) => api.post(`/vms/${id}/disks/detach`, { diskPath }),
  mountISO: (id, isoPath) => api.post(`/vms/${id}/iso/mount`, { isoPath }),
  unmountISO: (id) => api.post(`/vms/${id}/iso/unmount`),
};

// Disks API
export const diskAPI = {
  list: () => api.get('/disks'),
  create: (config) => api.post('/disks', config),
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/disks/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  get: (id) => api.get(`/disks/${id}`),
  delete: (id) => api.delete(`/disks/${id}`),
};

// ISOs API
export const isoAPI = {
  list: () => api.get('/isos'),
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/isos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  get: (id) => api.get(`/isos/${id}`),
  delete: (id) => api.delete(`/isos/${id}`),
};

export default api;
