import api from './api';

export async function fetchCurrentUser() {
  const res = await api.get('/auth/me');
  return res.data;
}

export function startGoogleLogin() {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  window.location.href = `${base}/auth/google`;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('fx_token');
  }
}
