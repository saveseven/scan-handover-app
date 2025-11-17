import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const scanService = {
  scanBox: async (boxId, userEmail, allowDuplicate = false) => {
    const response = await api.post('/scans/scan', { boxId, userEmail, allowDuplicate });
    return response.data;
  },

  getScans: async () => {
    const response = await api.get('/scans/history');
    return response.data;
  },

  getFilteredScans: async (filters) => {
    const response = await api.get('/scans/filtered', { params: filters });
    return response.data;
  },

  getDestinationCounts: async () => {
    const response = await api.get('/scans/counts');
    return response.data;
  },

  getPendingScans: async () => {
    const response = await api.get('/scans/pending');
    return response.data;
  },

  processPendingScans: async () => {
    const response = await api.post('/scans/process-pending');
    return response.data;
  },

  exportScans: async (format, filters = {}) => {
    const response = await api.get('/scans/export', {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response.data;
  },

  uploadDispatchData: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/scans/upload-dispatch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // New delete function
  deleteScan: async (scanId) => {
    const response = await api.delete(`/scans/${scanId}`);
    return response.data;
  }
};