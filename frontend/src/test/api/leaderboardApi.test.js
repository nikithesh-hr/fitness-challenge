import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLeaderboard } from '../../api/leaderboardApi';

vi.mock('../../api/apiClient', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../../api/apiClient';

describe('leaderboardApi', () => {
  beforeEach(() => { apiFetch.mockReset(); });

  describe('getLeaderboard', () => {
    it('calls GET /v1/leaderboard with default page=0 and size=10', async () => {
      apiFetch.mockResolvedValue({ content: [], page: { totalPages: 0, totalElements: 0 } });
      await getLeaderboard();
      expect(apiFetch).toHaveBeenCalledWith('/v1/leaderboard?page=0&size=10');
    });

    it('passes custom page and size parameters', async () => {
      apiFetch.mockResolvedValue({ content: [], page: { totalPages: 3, totalElements: 25 } });
      await getLeaderboard(2, 5);
      expect(apiFetch).toHaveBeenCalledWith('/v1/leaderboard?page=2&size=5');
    });

    it('returns the paginated leaderboard response', async () => {
      const response = {
        content: [
          { rank: 1, userId: 'u1', fullName: 'Alice Brown', totalPoints: 2000 },
          { rank: 2, userId: 'u2', fullName: 'Bob Jones',   totalPoints: 1500 },
        ],
        page: { size: 10, number: 0, totalElements: 2, totalPages: 1 },
      };
      apiFetch.mockResolvedValue(response);

      const result = await getLeaderboard();
      expect(result.content).toHaveLength(2);
      expect(result.content[0].rank).toBe(1);
      expect(result.content[1].fullName).toBe('Bob Jones');
      expect(result.page.totalElements).toBe(2);
    });

    it('returns empty content when no entries', async () => {
      apiFetch.mockResolvedValue({ content: [], page: { totalPages: 0, totalElements: 0 } });
      const result = await getLeaderboard();
      expect(result.content).toEqual([]);
    });

    it('propagates errors from apiFetch', async () => {
      apiFetch.mockRejectedValue({ message: 'Server error', status: 500 });
      await expect(getLeaderboard()).rejects.toMatchObject({ status: 500 });
    });
  });
});
