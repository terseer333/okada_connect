import { useState } from 'react';
import Header from '../components/Header.jsx';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { api } from '../services/api.js';

export default function CustomerDashboard() {
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [nearby, setNearby] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const { position, error: locError, requestOnce } = useGeolocation();

  async function confirmPickup() {
    if (!position) {
      requestOnce();
      return;
    }
    setPickupConfirmed(true);
    setSearchError(null);
    try {
      await api.updateCustomerLocation(position.coords.latitude, position.coords.longitude);
    } catch (err) {
      setSearchError(err.message);
    }
  }

  async function findRiders() {
    if (!position) return;
    setSearching(true);
    setSearchError(null);
    try {
      const data = await api.nearbyRiders(position.coords.latitude, position.coords.longitude);
      setNearby(data.riders);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-md px-4 py-6">
        <h1 className="text-xl font-bold">Where do you want to go?</h1>

        {locError ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{locError}</p>
        ) : (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span aria-hidden>📍</span>
            <span>
              {position
                ? `Location found (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
                : 'Detecting current location…'}
            </span>
          </div>
        )}

        {/* Map placeholder — real map lands in Phase 5 */}
        <div className="mt-4 flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white">
          <p className="px-8 text-center text-sm text-gray-400">
            Map view coming soon
            <br />
            (your location will appear here)
          </p>
        </div>

        <div className="mt-4">
          <button
            onClick={confirmPickup}
            disabled={!position}
            className="w-full rounded-xl border-2 border-okada px-6 py-3 font-semibold text-okada hover:bg-green-50 disabled:opacity-50"
          >
            {pickupConfirmed ? '✓ Pickup location confirmed' : 'Confirm pickup location'}
          </button>
        </div>

        <div className="mt-4">
          <button
            onClick={findRiders}
            disabled={!pickupConfirmed || searching}
            className="w-full rounded-xl bg-okada px-6 py-4 text-lg font-semibold text-white hover:bg-okada-dark disabled:bg-gray-300"
          >
            {searching ? 'Finding riders…' : 'REQUEST OKADA'}
          </button>
          {!pickupConfirmed && (
            <p className="mt-2 text-center text-xs text-gray-400">
              Confirm your pickup location first
            </p>
          )}
        </div>

        {searchError && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{searchError}</p>
        )}

        {nearby && (
          <div className="mt-6">
            <h2 className="text-lg font-bold">Nearby Riders</h2>
            {nearby.length === 0 ? (
              <p className="mt-3 rounded-xl bg-white p-6 text-center text-sm text-gray-400 shadow-sm">
                No riders online within 3 km right now. Try again in a moment.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {nearby.map((r) => (
                  <li key={r.userId} className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">🏍️ {r.name}</p>
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                        {r.distanceKm} km away
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {r.motorcycleModel || 'Motorcycle'}
                      {r.motorcycleNumber && ` • ${r.motorcycleNumber}`}
                      {r.ratingCount > 0 && ` • ⭐ ${r.rating.toFixed(1)} (${r.ratingCount})`}
                    </p>
                    <button
                      disabled
                      title="Ride requests land in Phase 6"
                      className="mt-3 w-full rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-500"
                    >
                      Request ride (coming soon)
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
