import { apiFetch } from './apiClient';

export function getLeaderboard(page = 0, size = 10) {
  return apiFetch(`/v1/leaderboard?page=${page}&size=${size}`);
}
