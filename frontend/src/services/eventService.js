import api from './api';

export async function listVenues() {
  const res = await api.get('/events/venues');
  return res.data; // [{ id, name }, ...]
}

export async function createVenue(name) {
  const res = await api.post('/events/venues', { name });
  return res.data;
}

export async function renameVenue(id, name) {
  const res = await api.patch(`/events/venues/${id}`, { name });
  return res.data;
}

export async function deleteVenue(id) {
  const res = await api.delete(`/events/venues/${id}`);
  return res.data;
}

export async function createEvent(payload) {
  const res = await api.post('/events', payload);
  return res.data;
}

export async function updateEvent(id, payload) {
  const res = await api.patch(`/events/${id}`, payload);
  return res.data;
}

export async function cancelEvent(id) {
  const res = await api.patch(`/events/${id}/cancel`);
  return res.data;
}

export async function deleteEvent(id) {
  const res = await api.delete(`/events/${id}`);
  return res.data;
}

export async function listEvents(params = {}) {
  const res = await api.get('/events', { params });
  return res.data;
}

export async function getEvent(id) {
  const res = await api.get(`/events/${id}`);
  return res.data;
}

export async function approveHod(id, status) {
  const res = await api.patch(`/events/${id}/approve-hod`, { status });
  return res.data;
}

export async function approvePrincipal(id, status) {
  const res = await api.patch(`/events/${id}/approve-principal`, { status });
  return res.data;
}

export async function approveCampusManager(id, status) {
  const res = await api.patch(`/events/${id}/approve-campus-manager`, { status });
  return res.data;
}
