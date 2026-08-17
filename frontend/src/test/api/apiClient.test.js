import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from '../../api/apiClient';

function makeFetchResponse({ ok = true, status = 200, body = {} } = {}) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe('apiFetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls fetch with the correct URL and Content-Type header', async () => {
    fetch.mockResolvedValue(makeFetchResponse({ body: { ok: true } }));

    await apiFetch('/v1/users');

    expect(fetch).toHaveBeenCalledOnce();
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/v1/users');
    expect(opts.headers['Content-Type']).toBe('application/json');
  });

  it('returns parsed JSON body for a 200 response', async () => {
    const data = { userId: 'abc-123', firstName: 'Jane' };
    fetch.mockResolvedValue(makeFetchResponse({ body: data }));

    const result = await apiFetch('/v1/users/register', { method: 'POST' });

    expect(result).toEqual(data);
  });

  it('returns null for a 204 No Content response', async () => {
    fetch.mockResolvedValue(makeFetchResponse({ ok: true, status: 204 }));

    const result = await apiFetch('/v1/something');

    expect(result).toBeNull();
  });

  it('throws parsed error body when response is not ok (400)', async () => {
    const errorBody = { message: 'Validation failed', errors: [{ field: 'email' }] };
    fetch.mockResolvedValue(makeFetchResponse({ ok: false, status: 400, body: errorBody }));

    await expect(apiFetch('/v1/users/register', { method: 'POST' })).rejects.toEqual(errorBody);
  });

  it('throws fallback error object when error body is not valid JSON (500)', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('invalid json')),
    });

    await expect(apiFetch('/v1/users')).rejects.toMatchObject({
      message: expect.stringContaining('500'),
    });
  });

  it('throws parsed 409 Conflict body', async () => {
    const errorBody = { message: 'User Jane Smith already exists', status: 409 };
    fetch.mockResolvedValue(makeFetchResponse({ ok: false, status: 409, body: errorBody }));

    await expect(apiFetch('/v1/users/register', { method: 'POST' })).rejects.toEqual(errorBody);
  });

  it('forwards extra options (method, body) to fetch', async () => {
    fetch.mockResolvedValue(makeFetchResponse({ body: { userId: '1' } }));

    await apiFetch('/v1/users/register', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Jane' }),
    });

    const [, opts] = fetch.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(opts.body).toContain('Jane');
  });
});
