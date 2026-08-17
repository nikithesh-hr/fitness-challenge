import { apiFetch } from './apiClient';

export function registerUser(data) {
  return apiFetch('/v1/users/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}


export function getRecentUsers() {
  return apiFetch('/v1/users/recent');
}

export function searchUsers(q) {
  return apiFetch(`/v1/users/search?q=${encodeURIComponent(q)}`);
}

export function getDashboard(userId) {
  return apiFetch(`/v1/users/${userId}/dashboard`);
}

export function getActivities(userId, page = 0, size = 10) {
  return apiFetch(`/v1/users/${userId}/activities?page=${page}&size=${size}`);
}

export function deleteUser(userId) {
  return apiFetch(`/v1/users/${userId}`, { method: 'DELETE' });
}
