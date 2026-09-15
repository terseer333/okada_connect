import { useEffect, useMemo, useRef, useState } from 'react';
import Header from '../components/Header.jsx';
import MapView from '../components/MapView.jsx';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { api } from '../services/api.js';

const LOCATION_INTERVAL_MS = 15_000; // heartbeat: rider must appear "fresh" to customers

export default function RiderDashboard() {
  const [rider, setRider] = useState(null);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [locError, setLocError] = useState(null);

  const online = rider?.availability_status === 'online';

  useEffect(() => {
    api
      .riderProfile()
      .then((data) => setRider(data.rider))
      .catch((err) => setError(err.message));
  }, []);

  const { position } = useGeolocation({ enabled: online });

  // Push the latest fix to the backend whenever it changes…
  const positionRef = useRef(null);
  positionRef.current = position;
  useEffect(() => {
    if (!online || !position) return;
    api
      .updateRiderLocation(position.coords.latitude, position.coords.longitude)
      .then(() => setLocError(null))
      .catch((err) => setLocError(err.message));
  }, [online, position]);

  // …and on a heartbeat so a stationary rider never goes stale.
  useEffect(() => {
    if (!online) return undefined;
    const id = setInterval(() => {
      const pos = positionRef.current;
      if (!pos) return;
      api.updateRiderLocation(pos.coords.latitude, pos.coords.longitude).catch((err) =>
        setLocError(err.message),
      );
    }, LOCATION_INTERVAL_MS);
    return () => clearInterval(id);
  }, [online]);

  async function toggleOnline() {
    if (!rider || toggling) return;
    const next = rider.availability_status === 'online' ? 'offline' : 'online';
    setToggling(true);
    setError(null);
    try {
      const data = await api.updateRiderStatus(next);
      setRider(data.rider);
    } catch (err) {
      setError(err.message);
    } finally {
      setToggling(false);
    }
  }

  const center = useMemo(
    () => (position ? [position.coords.latitude, position.coords.longitude] : null),
    [position],
  );
  const markers = useMemo(
    () =>
      center
        ? [{ id: 'me', position: center, label: 'You (live GPS)', kind: 'rider' }]
        : [],
    [center],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-md px-4 py-6">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Rider Status</h1>
          <span
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
              online ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`}
              aria-hidden
            />
            {online ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <button
          onClick={toggleOnline}
          disabled={toggling || !rider}
          className={`mt-4 w-full rounded-xl px-6 py-3 font-semibold text-white disabled:opacity-60 ${
            online ? 'bg-red-500 hover:bg-red-600' : 'bg-okada hover:bg-okada-dark'
          }`}
        >
          {toggling ? 'Updating…' : online ? 'Go Offline' : 'Go Online'}
        </button>

        {online && (
          <p className="mt-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {position
              ? `📍 Sharing location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
              : locError || 'Waiting for GPS fix…'}
          </p>
        )}

        <div className="mt-6 h-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {center ? (
            <MapView center={center} markers={markers} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              {online ? (locError || 'Waiting for GPS fix…') : 'Go online to share your location'}
            </div>
          )}
        </div>

        {rider && (rider.motorcycle_number || rider.motorcycle_model) && (
          <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500">My Motorcycle</h2>
            <p className="mt-1 font-medium">
              {rider.motorcycle_model || '—'}
              {rider.motorcycle_number && (
                <span className="ml-2 text-sm text-gray-500">
                  ({rider.motorcycle_number})
                </span>
              )}
            </p>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-lg font-bold">Nearby Requests</h2>
          <div className="mt-3 rounded-xl bg-white p-6 text-center text-sm text-gray-400 shadow-sm">
            You'll see ride requests from nearby customers here.
            <br />
            (coming soon)
          </div>
        </div>
      </main>
    </div>
  );
}
