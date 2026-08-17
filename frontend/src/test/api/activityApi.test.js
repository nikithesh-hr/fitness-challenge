import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logActivity, deleteActivity } from '../../api/activityApi';

vi.mock('../../api/apiClient', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../../api/apiClient';

describe('activityApi', () => {
  beforeEach(() => { apiFetch.mockReset(); });

  describe('logActivity', () => {
    it('calls POST /v1/activities with serialized body', async () => {
      const payload = {
        userId: 'user-123',
        sport: 'RUNNING',
        distanceKm: 5.25,
        recordedAt: '2026-08-11T09:00:00',
      };
      apiFetch.mockResolvedValue({ activityId: 'act-1', pointsAwarded: 525 });

      await logActivity(payload);

      expect(apiFetch).toHaveBeenCalledWith('/v1/activities', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {},
      });
    });

    it('returns the response with pointsAwarded', async () => {
      apiFetch.mockResolvedValue({ pointsAwarded: 525 });
      const result = await logActivity({});
      expect(result.pointsAwarded).toBe(525);
    });

    it('propagates error thrown by apiFetch', async () => {
      apiFetch.mockRejectedValue({ message: 'User not found', status: 404 });
      await expect(logActivity({})).rejects.toMatchObject({ status: 404 });
    });

    // ── Idempotency-Key header ────────────────────────────────────────────────

    it('sends Idempotency-Key header when key is provided', async () => {
      const key = 'f3a2b1c4-1234-5678-abcd-ef0123456789';
      apiFetch.mockResolvedValue({ pointsAwarded: 525 });

      await logActivity({ sport: 'RUNNING' }, key);

      expect(apiFetch).toHaveBeenCalledWith('/v1/activities', {
        method: 'POST',
        body: expect.any(String),
        headers: { 'Idempotency-Key': key },
      });
    });

    it('sends empty headers object when no idempotency key provided', async () => {
      apiFetch.mockResolvedValue({ pointsAwarded: 525 });

      await logActivity({ sport: 'RUNNING' });

      expect(apiFetch).toHaveBeenCalledWith('/v1/activities', {
        method: 'POST',
        body: expect.any(String),
        headers: {},
      });
    });

    it('does not send Idempotency-Key header when key is undefined', async () => {
      apiFetch.mockResolvedValue({ pointsAwarded: 525 });

      await logActivity({ sport: 'RUNNING' }, undefined);

      const [, opts] = apiFetch.mock.calls[0];
      expect(opts.headers).toEqual({});
      expect(opts.headers['Idempotency-Key']).toBeUndefined();
    });
  });

  describe('deleteActivity', () => {
    it('calls DELETE /v1/activities/{activityId}', async () => {
      apiFetch.mockResolvedValue(undefined);
      await deleteActivity('act-abc-123');
      expect(apiFetch).toHaveBeenCalledWith('/v1/activities/act-abc-123', { method: 'DELETE' });
    });

    it('returns the resolved value from apiFetch', async () => {
      apiFetch.mockResolvedValue(undefined);
      const result = await deleteActivity('act-abc-123');
      expect(result).toBeUndefined();
    });

    it('propagates error thrown by apiFetch', async () => {
      apiFetch.mockRejectedValue({ message: 'Activity not found', status: 404 });
      await expect(deleteActivity('act-abc-123')).rejects.toMatchObject({ status: 404 });
    });
  });
});
