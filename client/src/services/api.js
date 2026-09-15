const BASE_URL = '/api';

const TOKEN_KEY = 'okada_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && getToken()) {
    headers.Authorization = `Bearer ${getToken()}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response (e.g. proxy down)
  }

  if (!res.ok) {
    const error = new Error(data?.error || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me', { auth: true }),
  riderProfile: () => request('/riders/profile', { auth: true }),
  updateRiderStatus: (availabilityStatus) =>
    request('/riders/status', { method: 'PATCH', body: { availabilityStatus }, auth: true }),
  updateRiderLocation: (latitude, longitude) =>
    request('/riders/location', { method: 'PUT', body: { latitude, longitude }, auth: true }),
  updateCustomerLocation: (latitude, longitude) =>
    request('/customers/location', { method: 'PUT', body: { latitude, longitude }, auth: true }),
  nearbyRiders: (latitude, longitude) =>
    request(`/riders/nearby?latitude=${latitude}&longitude=${longitude}`, { auth: true }),
};
