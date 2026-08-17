const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function apiFetch(path, options = {}) {
  const { headers: customHeaders, ...restOptions } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
    ...restOptions,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      message: `Request failed with status ${res.status}`,
    }));
    throw error;
  }

  return res.status === 204 ? null : res.json();
}
