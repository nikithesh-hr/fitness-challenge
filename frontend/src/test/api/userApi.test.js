import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerUser, searchUsers, getDashboard, getActivities, deleteUser } from '../../api/userApi';

vi.mock('../../api/apiClient', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../../api/apiClient';

describe('userApi', () => {
  beforeEach(() => { apiFetch.mockReset(); });

  describe('registerUser', () => {
    it('calls POST /v1/users/register with serialized body', async () => {
      const payload = { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' };
      apiFetch.mockResolvedValue({ userId: 'abc' });

      await registerUser(payload);

      expect(apiFetch).toHaveBeenCalledWith('/v1/users/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    });

    it('returns the resolved value from apiFetch', async () => {
      apiFetch.mockResolvedValue({ userId: 'abc-123' });
      const result = await registerUser({});
      expect(result).toEqual({ userId: 'abc-123' });
    });
  });


  describe('searchUsers', () => {
    it('calls GET /v1/users/search with encoded query', async () => {
      apiFetch.mockResolvedValue([]);
      await searchUsers('jane smith');
      expect(apiFetch).toHaveBeenCalledWith('/v1/users/search?q=jane%20smith');
    });

    it('encodes special characters in query', async () => {
      apiFetch.mockResolvedValue([]);
      await searchUsers('jane & john');
      expect(apiFetch).toHaveBeenCalledWith(
        expect.stringContaining('jane%20%26%20john')
      );
    });
  });

  describe('getDashboard', () => {
    it('calls GET /v1/users/{userId}/dashboard', async () => {
      apiFetch.mockResolvedValue({});
      await getDashboard('user-uuid-123');
      expect(apiFetch).toHaveBeenCalledWith('/v1/users/user-uuid-123/dashboard');
    });
  });

  describe('getActivities', () => {
    it('calls GET with default page=0 and size=10', async () => {
      apiFetch.mockResolvedValue({ content: [] });
      await getActivities('user-uuid-123');
      expect(apiFetch).toHaveBeenCalledWith(
        '/v1/users/user-uuid-123/activities?page=0&size=10'
      );
    });

    it('passes custom page and size', async () => {
      apiFetch.mockResolvedValue({ content: [] });
      await getActivities('user-uuid-123', 2, 20);
      expect(apiFetch).toHaveBeenCalledWith(
        '/v1/users/user-uuid-123/activities?page=2&size=20'
      );
    });
  });

  describe('deleteUser', () => {
    it('calls DELETE /v1/users/{userId}', async () => {
      apiFetch.mockResolvedValue(undefined);
      await deleteUser('user-uuid-123');
      expect(apiFetch).toHaveBeenCalledWith('/v1/users/user-uuid-123', { method: 'DELETE' });
    });

    it('returns the resolved value from apiFetch', async () => {
      apiFetch.mockResolvedValue(undefined);
      const result = await deleteUser('user-uuid-123');
      expect(result).toBeUndefined();
    });

    it('propagates error thrown by apiFetch', async () => {
      apiFetch.mockRejectedValue({ message: 'User not found', status: 404 });
      await expect(deleteUser('user-uuid-123')).rejects.toMatchObject({ status: 404 });
    });
  });
});
