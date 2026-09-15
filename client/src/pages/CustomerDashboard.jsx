import { useState } from 'react';
import Header from '../components/Header.jsx';

export default function CustomerDashboard() {
  const [pickupConfirmed, setPickupConfirmed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-md px-4 py-6">
        <h1 className="text-xl font-bold">Where do you want to go?</h1>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <span aria-hidden>📍</span>
          <span>Detecting current location…</span>
        </div>

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
            onClick={() => setPickupConfirmed((v) => !v)}
            className="w-full rounded-xl border-2 border-okada px-6 py-3 font-semibold text-okada hover:bg-green-50"
          >
            {pickupConfirmed ? '✓ Pickup location confirmed' : 'Confirm pickup location'}
          </button>
        </div>

        <div className="mt-4">
          <button
            disabled
            className="w-full rounded-xl bg-gray-300 px-6 py-4 text-lg font-semibold text-white"
            title="Available once maps and ride requests are built"
          >
            REQUEST OKADA
          </button>
          <p className="mt-2 text-center text-xs text-gray-400">
            Ride requests coming soon
          </p>
        </div>
      </main>
    </div>
  );
}
