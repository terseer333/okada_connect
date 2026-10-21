import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MapView, { type MapMarker } from '../components/MapView'
import { useGeolocation } from '../hooks/useGeolocation'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

const POLL_MS = 4000

type Ride = {
  id: string
  status: 'pending' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled'
  pickupLatitude: number
  pickupLongitude: number
  distanceKm?: number
  rider: {
    id: string
    name: string
    phone: string
    motorcycleNumber?: string | null
    motorcycleModel?: string | null
    latitude?: number | null
    longitude?: number | null
  } | null
}

type NearbyRider = {
  userId: string
  name: string
  motorcycleNumber?: string | null
  motorcycleModel?: string | null
  rating: number
  ratingCount: number
  latitude: number
  longitude: number
  distanceKm: number
}

const ACTIVE_STATUSES = ['pending', 'accepted', 'arriving', 'in_progress']

export default function CustomerDashboard() {
  const { user, logout } = useAuth()
  const [pickup, setPickup] = useState<[number, number] | null>(null)
  const [pickupConfirmed, setPickupConfirmed] = useState(false)
  const [nearby, setNearby] = useState<NearbyRider[] | null>(null)
  const [ride, setRide] = useState<Ride | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { position, error: locError, requestOnce } = useGeolocation()

  const effectivePickup: [number, number] | null =
    pickup || (position ? [position.coords.latitude, position.coords.longitude] : null)
  const rideActive = Boolean(ride && ACTIVE_STATUSES.includes(ride.status))

  // Adjust pickup by tapping the map (README: "Customers should be able to
  // confirm or adjust their pickup point on the map").
  function handleMapPick([lat, lon]: [number, number]) {
    setPickup([lat, lon])
    setPickupConfirmed(false)
  }

  async function confirmPickup() {
    if (!effectivePickup) {
      requestOnce()
      return
    }
    setError(null)
    try {
      await api.updateCustomerLocation(effectivePickup[0], effectivePickup[1])
      setPickup(effectivePickup)
      setPickupConfirmed(true)
      // Preview of who would receive the request.
      const data = await api.nearbyRiders(effectivePickup[0], effectivePickup[1])
      setNearby(data.riders)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function requestRide() {
    if (!effectivePickup || creating) return
    setCreating(true)
    setError(null)
    try {
      const data = await api.createRide(effectivePickup[0], effectivePickup[1])
      setRide(data.ride)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function cancelRide() {
    if (!ride) return
    setError(null)
    try {
      const data = await api.cancelRide(ride.id)
      setRide(data.ride)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function completeRide() {
    if (!ride) return
    setError(null)
    try {
      const data = await api.completeRide(ride.id)
      setRide(data.ride)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  // Poll the backend for ride updates (real-time sockets come in Phase 8).
  useEffect(() => {
    if (!rideActive) return undefined
    const id = setInterval(() => {
      api
        .activeRide()
        .then((data) => setRide(data.ride))
        .catch(() => {})
    }, POLL_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.status])

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = []
    const center: [number, number] | null = rideActive
      ? [ride!.pickupLatitude, ride!.pickupLongitude]
      : effectivePickup
    if (center) {
      list.push({
        id: 'pickup',
        position: center,
        label: rideActive ? 'Pickup point' : 'Pickup point (tap map to adjust)',
        kind: 'pickup',
      })
    }
    // Live rider marker once a ride is accepted.
    if (ride?.rider?.latitude != null && ride.rider.longitude != null) {
      list.push({
        id: `rider-${ride.rider.id}`,
        position: [ride.rider.latitude, ride.rider.longitude],
        label: `🏍️ ${ride.rider.name}`,
        kind: 'rider',
      })
    }
    // Preview of available riders before requesting.
    if (!rideActive) {
      for (const r of nearby || []) {
        list.push({
          id: `rider-${r.userId}`,
          position: [r.latitude, r.longitude],
          label: `${r.name} • ${r.distanceKm} km`,
          kind: 'rider',
        })
      }
    }
    return list
  }, [effectivePickup, nearby, ride, rideActive])

  const mapCenter: [number, number] | null = rideActive
    ? [ride!.pickupLatitude, ride!.pickupLongitude]
    : effectivePickup

  return (
    <main className="dash-page">
      <header className="dash-topbar">
        <Link to="/" className="dash-brand">
          <span aria-hidden>🏍️</span>
          <strong>
            OKADA<span>CONNECT</span>
          </strong>
        </Link>
        <div className="dash-user">
          <span className="dash-user-name">{user?.name}</span>
          <button type="button" className="text-button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <div className="dash-body">
        {error && <p className="auth-error">{error}</p>}
        {locError && !ride && <p className="auth-error">{locError}</p>}

        {ride && !rideActive ? (
          <section className="dash-card">
            <div className={`dash-status ${ride.status === 'completed' ? 'done' : 'cancelled'}`}>
              {ride.status === 'completed'
                ? '✅ Ride completed. Thanks for riding with Okada Connect!'
                : '❌ Ride cancelled.'}
            </div>
            <button
              type="button"
              className="submit-button"
              onClick={() => {
                setRide(null)
                setNearby(null)
                setPickupConfirmed(false)
              }}
            >
              Request another ride
            </button>
          </section>
        ) : rideActive && ride ? (
          <section className="dash-card">
            <div className={`dash-status ${ride.status}`}>
              {ride.status === 'pending' && (
                <>
                  <b>Looking for a rider…</b>
                  <small>Your request was sent to available riders within 3 km.</small>
                </>
              )}
              {ride.status === 'accepted' && (
                <>
                  <b>✅ Ride accepted!</b>
                  <small>Your rider is on the way to your pickup point.</small>
                </>
              )}
              {ride.status === 'arriving' && (
                <>
                  <b>🏍️ Rider arriving</b>
                  <small>Your rider is close to the pickup point.</small>
                </>
              )}
              {ride.status === 'in_progress' && (
                <>
                  <b>🛵 Ride in progress</b>
                  <small>Enjoy the ride. Tap "Complete ride" when you arrive.</small>
                </>
              )}
            </div>

            <div className="dash-map">
              {mapCenter && <MapView center={mapCenter} markers={markers} />}
            </div>

            <div className="dash-detail">
              <h2>Pickup</h2>
              <p>
                {ride.pickupLatitude.toFixed(5)}, {ride.pickupLongitude.toFixed(5)}
              </p>

              {ride.rider && (
                <div className="dash-rider">
                  <div className="dash-rider-head">
                    <b>🏍️ {ride.rider.name}</b>
                    {ride.distanceKm != null && (
                      <span className="dash-pill">{ride.distanceKm} km away</span>
                    )}
                  </div>
                  <p>
                    {ride.rider.motorcycleModel || 'Motorcycle'}
                    {ride.rider.motorcycleNumber && ` • ${ride.rider.motorcycleNumber}`}
                  </p>
                  <p>📞 {ride.rider.phone}</p>
                  {ride.rider.latitude != null && ride.rider.longitude != null && (
                    <a
                      className="dash-link-button"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${ride.rider.latitude},${ride.rider.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open rider location in maps
                    </a>
                  )}
                </div>
              )}
            </div>

            {ride.status === 'in_progress' ? (
              <button type="button" className="submit-button" onClick={completeRide}>
                Complete ride
              </button>
            ) : (
              <button type="button" className="dash-cancel-button" onClick={cancelRide}>
                Cancel ride
              </button>
            )}
          </section>
        ) : (
          <section className="dash-card">
            <h1 className="dash-title">Where do you want to go?</h1>

            <div className="dash-loc">
              <span aria-hidden>📍</span>
              <span>
                {effectivePickup
                  ? `Pickup: ${effectivePickup[0].toFixed(4)}, ${effectivePickup[1].toFixed(4)}`
                  : 'Detecting current location…'}
              </span>
            </div>

            <div className="dash-map">
              {effectivePickup ? (
                <MapView center={effectivePickup} markers={markers} onPick={handleMapPick} />
              ) : (
                <p className="dash-map-empty">{locError || 'Waiting for location…'}</p>
              )}
            </div>
            <p className="dash-hint">Tap the map to adjust your pickup point</p>

            <button
              type="button"
              className="dash-outline-button"
              onClick={confirmPickup}
              disabled={!effectivePickup}
            >
              {pickupConfirmed ? '✓ Pickup location confirmed' : 'Confirm pickup location'}
            </button>

            <button
              type="button"
              className="submit-button"
              onClick={requestRide}
              disabled={!pickupConfirmed || creating}
            >
              {creating ? 'Sending request…' : 'REQUEST OKADA'}
            </button>
            {!pickupConfirmed && (
              <p className="dash-hint">Confirm your pickup location first</p>
            )}

            {nearby && (
              <div className="dash-list">
                <h2 className="dash-subtitle">Riders near you</h2>
                {nearby.length === 0 ? (
                  <p className="dash-empty">
                    No riders online within 3 km right now. Your request will still be sent — a
                    rider nearby may come online shortly.
                  </p>
                ) : (
                  <ul>
                    {nearby.map((r) => (
                      <li key={r.userId}>
                        <div className="dash-list-head">
                          <b>🏍️ {r.name}</b>
                          <span className="dash-pill">{r.distanceKm} km away</span>
                        </div>
                        <p>
                          {r.motorcycleModel || 'Motorcycle'}
                          {r.motorcycleNumber && ` • ${r.motorcycleNumber}`}
                          {r.ratingCount > 0 && ` • ⭐ ${r.rating.toFixed(1)} (${r.ratingCount})`}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="dash-hint">These riders will receive your request</p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
