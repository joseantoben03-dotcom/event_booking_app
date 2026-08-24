import api from './api';

export async function listUsers(search) {
  const res = await api.get('/users', { params: search ? { search } : {} });
  return res.data;
}