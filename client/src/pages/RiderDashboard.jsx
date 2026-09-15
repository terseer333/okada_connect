import { useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import { api } from '../services/api.js';

export default function RiderDashboard() {
  const [rider, setRider] = useState(null);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    api
      .riderProfile()
      .then((data) => setRider(data.rider))
      .catch((err) => setError(err.message));
  }, []);

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

  const online = rider?.availability_status === 'online';

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

        {/* Map placeholder — real map + GPS sharing land in Phase 4/5 */}
        <div className="mt-6 flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white">
          <p className="px-8 text-center text-sm text-gray-400">
            Map view coming soon
            <br />
            (your location will be shared here when online)
          </p>
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
