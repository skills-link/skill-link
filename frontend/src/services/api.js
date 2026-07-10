import axios from 'axios';

// Resolve the API base URL and ensure it points at the backend API root
const rawApiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const apiBase = rawApiBase.endsWith('/api') ? rawApiBase : rawApiBase.replace(/\/+$/, '') + '/api';

// A single Axios instance keeps the API base URL and auth behavior in one place.
const api = axios.create({ baseURL: apiBase });

// Before every request, attach the saved JWT if the user is logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jobconnect_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Convert an uploaded filename from the database into a browser URL.
export const uploadUrl = (fileName) => {
  if (!fileName) return '';
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const base = raw.endsWith('/api') ? raw.replace(/\/api$/, '') : raw.replace(/\/+$/, '');
  return `${base}/uploads/${fileName}`;
};

export default api;
