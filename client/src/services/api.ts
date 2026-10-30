// API client for the FastAPI backend (see server/). The Vite dev server
// proxies /api to http://localhost:4000.
const BASE_URL = '/api';

const TOKEN_KEY = 'okada_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

async function request(path: string, { method = 'GET', body, auth = false }: RequestOptions = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
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
    const error = new Error(data?.detail || data?.error || `Request failed (${res.status})`);
    (error as Error & { status?: number }).status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  register: (payload: Record<string, unknown>) =>
    request('/auth/register', { method: 'POST', body: payload }),
  login: (payload: { email: string; password: string; role?: 'customer' | 'rider' }) =>
    request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me', { auth: true }),
  riderProfile: () => request('/riders/profile', { auth: true }),
  updateRiderStatus: (availabilityStatus: 'offline' | 'online' | 'busy') =>
    request('/riders/status', { method: 'PATCH', body: { availabilityStatus }, auth: true }),
  updateRiderLocation: (latitude: number, longitude: number) =>
    request('/riders/location', { method: 'PUT', body: { latitude, longitude }, auth: true }),
  postRiderLocation: (lat: number, lng: number) =>
    request('/riders/location', { method: 'POST', body: { lat, lng }, auth: true }),
  updateCustomerLocation: (latitude: number, longitude: number) =>
    request('/customers/location', { method: 'PUT', body: { latitude, longitude }, auth: true }),
  postCustomerLocation: (lat: number, lng: number) =>
    request('/customers/location', { method: 'POST', body: { lat, lng }, auth: true }),
  nearbyRiders: (latitude: number, longitude: number, radius = 3) =>
    request(`/riders/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`, { auth: true }),

  // Rides (Phase 6/7/Task 3)
  createRide: (payload: {
    latitude: number;
    longitude: number;
    pickupAddress?: string;
    destinationLatitude?: number;
    destinationLongitude?: number;
    destinationAddress?: string;
    fare?: number;
  }) => request('/rides', { method: 'POST', body: payload, auth: true }),
  activeRide: () => request('/rides/active', { auth: true }),
  cancelRide: (rideId: string) =>
    request(`/rides/${rideId}/cancel`, { method: 'POST', auth: true }),
  completeRide: (rideId: string) =>
    request(`/rides/${rideId}/complete`, { method: 'POST', auth: true }),
  nearbyRideRequests: () => request('/rides/nearby-requests', { auth: true }),
  acceptRide: (rideId: string, coords?: { lat: number; lng: number }) =>
    request(`/rides/${rideId}/accept`, { method: 'POST', body: coords, auth: true }),
  arrivingRide: (rideId: string) =>
    request(`/rides/${rideId}/arriving`, { method: 'POST', auth: true }),
  startRide: (rideId: string) => request(`/rides/${rideId}/start`, { method: 'POST', auth: true }),
  rideTracking: (rideId: string) => request(`/rides/${rideId}/tracking`, { auth: true }),
  rideHistory: (page = 1, limit = 10) =>
    request(`/rides/history?page=${page}&limit=${limit}`, { auth: true }),

  // Wallet
  wallet: () => request('/wallet', { auth: true }),
  walletTransactions: () => request('/wallet/transactions', { auth: true }),

  // User Profile & Photo
  userProfile: () => request('/users/me', { auth: true }),
  updateProfile: (data: { name?: string; phone?: string }) =>
    request('/users/me', { method: 'PATCH', body: data, auth: true }),
  uploadPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    if (getToken()) {
      headers.Authorization = `Bearer ${getToken()}`;
    }
    const res = await fetch(`${BASE_URL}/users/me/photo`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.detail || 'Photo upload failed');
    }
    return data;
  },
};
