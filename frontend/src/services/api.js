import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5050/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rb-admin-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Portfolio ──────────────────────────────────────────────
export const fetchPortfolio = () => api.get('/portfolio');
export const updatePortfolio = (data) => api.put('/portfolio', data);
export const uploadImage = (file, folder = 'rahul-babariya') => {
  const form = new FormData();
  form.append('image', file);
  form.append('folder', folder);
  return api.post('/portfolio/upload-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ── Auth ───────────────────────────────────────────────────
export const adminLogin = (password) => api.post('/auth/login', { password });

export default api;
