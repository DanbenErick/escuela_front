import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.startsWith('/auth/')
    ) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      // Dispatch storage event so AuthContext picks up the change
      // without a hard page reload
      window.dispatchEvent(new Event('storage'));
    }
    return Promise.reject(error);
  }
);

export default api;
