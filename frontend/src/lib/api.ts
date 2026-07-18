import axios from 'axios';

let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
// Auto-append /api if the user forgot it when setting NEXT_PUBLIC_API_URL
if (apiBaseUrl && !apiBaseUrl.endsWith('/api') && !apiBaseUrl.endsWith('/api/')) {
  apiBaseUrl = apiBaseUrl.replace(/\/$/, '') + '/api';
}

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  return config;
});

export default api;
