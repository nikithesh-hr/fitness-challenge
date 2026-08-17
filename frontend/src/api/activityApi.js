import { apiFetch } from './apiClient';

export function logActivity(data, idempotencyKey) {
  return apiFetch('/v1/activities', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
  });
}

export function deleteActivity(activityId) {
  return apiFetch(`/v1/activities/${activityId}`, { method: 'DELETE' });
}
