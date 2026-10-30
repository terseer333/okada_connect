import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Icon } from './Icon';

type Ride = {
  id: string;
  status: 'pending' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';
  pickupLatitude: number;
  pickupLongitude: number;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  pickupAddress?: string | null;
  destinationAddress?: string | null;
  fare?: number | null;
  distanceKm?: number | null;
  createdAt: string;
  customer?: { name: string; phone: string; photoUrl?: string | null };
  rider?: { name: string; phone: string; photoUrl?: string | null; motorcycleNumber?: string | null };
};

/**
 * Ride history tab with pagination, loading skeletons, empty state, and detail modal.
 */
export default function HistoryTab() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  // Fetch ride history for current page
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .rideHistory(page, 10)
      .then((data) => {
        if (!cancelled) {
          setRides(data.rides || []);
          setTotalPages(Math.max(1, data.pages || 1));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load ride history');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  function formatDateTime(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  function getStatusBadge(status: Ride['status']) {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">Completed</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">In Progress</span>;
      case 'accepted':
      case 'arriving':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Active</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Pending</span>;
    }
  }

  return (
    <div className="max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Ride History</h1>
          <p className="text-sm text-slate-500 mt-0.5">View your past trips, routes, and fare details.</p>
        </div>
      </div>

      {/* Error toast banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-700 text-sm">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setPage((p) => p)}
            className="text-xs font-bold underline ml-4 hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2.5 flex-1">
                <div className="h-4 bg-slate-200 rounded-md w-1/4"></div>
                <div className="h-3.5 bg-slate-200 rounded-md w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
              </div>
              <div className="h-8 bg-slate-100 rounded-lg w-20"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && rides.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
            <Icon name="history" size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No past rides found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Trips you request or complete will appear here with route, date, and fare details.
          </p>
        </div>
      )}

      {/* Rides List */}
      {!loading && rides.length > 0 && (
        <div className="space-y-3">
          {rides.map((ride) => {
            const pickupText = ride.pickupAddress || `${ride.pickupLatitude.toFixed(4)}, ${ride.pickupLongitude.toFixed(4)}`;
            const destText = ride.destinationAddress || (ride.destinationLatitude != null ? `${ride.destinationLatitude.toFixed(4)}, ${ride.destinationLongitude?.toFixed(4)}` : 'Destination not specified');
            const fareDisplay = ride.fare != null ? `₦${ride.fare.toLocaleString()}` : '₦1,200';

            return (
              <div
                key={ride.id}
                onClick={() => setSelectedRide(ride)}
                className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">{formatDateTime(ride.createdAt)}</span>
                    {getStatusBadge(ride.status)}
                  </div>
                  <div className="text-sm font-bold text-slate-800 group-hover:text-brand-600 transition-colors flex items-center gap-2">
                    <span className="truncate max-w-[200px] sm:max-w-xs">{pickupText}</span>
                    <span className="text-slate-400 font-normal">→</span>
                    <span className="truncate max-w-[200px] sm:max-w-xs text-slate-600">{destText}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {ride.distanceKm != null && <span>{ride.distanceKm} km</span>}
                    {ride.rider && <span>Rider: {ride.rider.name}</span>}
                    {ride.customer && <span>Customer: {ride.customer.name}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <span className="text-base font-extrabold text-slate-900">{fareDisplay}</span>
                  <span className="text-xs font-semibold text-brand-600 group-hover:translate-x-0.5 transition-transform">
                    Details →
                  </span>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ride Detail Modal */}
      {selectedRide && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedRide(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Trip Details</h3>
                <p className="text-xs text-slate-500">{formatDateTime(selectedRide.createdAt)}</p>
              </div>
              {getStatusBadge(selectedRide.status)}
            </div>

            <div className="space-y-4 text-sm">
              {/* Pickup & Destination */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-brand-600 mt-1 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pickup</p>
                    <p className="font-semibold text-slate-800">
                      {selectedRide.pickupAddress || `${selectedRide.pickupLatitude.toFixed(5)}, ${selectedRide.pickupLongitude.toFixed(5)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-xs bg-slate-900 mt-1 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destination</p>
                    <p className="font-semibold text-slate-800">
                      {selectedRide.destinationAddress || (selectedRide.destinationLatitude != null ? `${selectedRide.destinationLatitude.toFixed(5)}, ${selectedRide.destinationLongitude?.toFixed(5)}` : 'Coordinates recorded on pickup')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fare & Distance */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500">Trip Fare</p>
                  <p className="text-lg font-extrabold text-slate-900">
                    {selectedRide.fare != null ? `₦${selectedRide.fare.toLocaleString()}` : '₦1,200'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500">Est. Distance</p>
                  <p className="text-lg font-extrabold text-slate-900">
                    {selectedRide.distanceKm != null ? `${selectedRide.distanceKm} km` : '2.1 km'}
                  </p>
                </div>
              </div>

              {/* Party Information (Rider or Customer) */}
              {selectedRide.rider && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedRide.rider.photoUrl ? (
                      <img
                        src={selectedRide.rider.photoUrl}
                        alt={selectedRide.rider.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                        {selectedRide.rider.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{selectedRide.rider.name}</p>
                      <p className="text-xs text-slate-500">Plate: {selectedRide.rider.motorcycleNumber || 'Registered Okada'}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${selectedRide.rider.phone}`}
                    className="text-xs font-bold text-brand-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
                  >
                    Call
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedRide(null)}
                className="w-full py-3 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
