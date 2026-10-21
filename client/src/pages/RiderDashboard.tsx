import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MapView, { type MapMarker } from '../components/MapView'
import { useGeolocation } from '../hooks/useGeolocation'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

const LOCATION_INTERVAL_MS = 15_000 // heartbeat: rider must appear "fresh" to customers
const REQUESTS_POLL_MS = 6_000 // refresh the list of nearby requests
const RIDE_POLL_MS = 5_000 // watch for customer cancel/complete while on a ride

type Rider = {
  user_id: string
  motorcycle_number?: string | null
  motorcycle_model?: string | null
  availability_status: 'offline' | 'online' | 'busy'
}

type RideRequest = {
  id: string
  pickupLatitude: number
  pickupLongitude: number
  distanceKm?: number
  customer: { id: string; name: string; phone: string }
}

type Ride = RideRequest & {
  status: 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled'
}

const ACTIVE_STATUSES = ['accepted', 'arriving', 'in_progress']

export default function RiderDashboard() {
  const { user, logout } = useAuth()
  const [rider, setRider] = useState<Rider | null>(null)
  const [ride, setRide] = useState<Ride | null>(null)
  const [requests, setRequests] = useState<RideRequest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [locError, setLocError] = useState<string | null>(null)

  const status = rider?.availability_status
  const online = status === 'online'
  const sharingLocation = status === 'online' || status === 'busy'
  const rideActive = Boolean(ride && ACTIVE_STATUSES.includes(ride.status))

  useEffect(() => {
    api
      .riderProfile()
      .then((data) => setRider(data.rider))
      .catch((err) => setError((err as Error).message))
    // Pick up a ride left over from a previous session/tab.
    api
      .activeRide()
      .then((data) => setRide(data.ride))
      .catch(() => {})
  }, [])

  const { position } = useGeolocation({ enabled: sharingLocation })

  // Push the latest fix to the backend whenever it changes…
  const positionRef = useRef<GeolocationPosition | null>(null)
  positionRef.current = position
  useEffect(() => {
    if (!sharingLocation || !position) return
    api
      .updateRiderLocation(position.coords.latitude, position.coords.longitude)
      .then(() => setLocError(null))
      .catch((err) => setLocError((err as Error).message))
  }, [sharingLocation, position])

  // …and on a heartbeat so a stationary rider never goes stale.
  useEffect(() => {
    if (!sharingLocation) return undefined
    const id = setInterval(() => {
      const pos = positionRef.current
      if (!pos) return
      api
        .updateRiderLocation(pos.coords.latitude, pos.coords.longitude)
        .catch((err) => setLocError((err as Error).message))
    }, LOCATION_INTERVAL_MS)
    return () => clearInterval(id)
  }, [sharingLocation])

  // While free, poll for new requests from nearby customers.
  useEffect(() => {
    if (!online || rideActive) return undefined
    let cancelled = false
    const fetchRequests = () =>
      api
        .nearbyRideRequests()
        .then((data) => {
          if (!cancelled) setRequests(data.requests)
        })
        .catch(() => {})
    fetchRequests()
    const id = setInterval(fetchRequests, REQUESTS_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [online, rideActive])

  // While on a ride, poll it for status changes (e.g. customer cancels).
  useEffect(() => {
    if (!rideActive) return undefined
    const id = setInterval(() => {
      api
        .activeRide()
        .then((data) => {
          if (data.ride) setRide(data.ride)
          else {
            // Ride ended on the customer's side — resync availability.
            setRide(null)
            api
              .riderProfile()
              .then((d) => setRider(d.rider))
              .catch(() => {})
          }
        })
        .catch(() => {})
    }, RIDE_POLL_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.status])

  async function toggleOnline() {
    if (!rider || toggling) return
    const next = online ? 'offline' : 'online'
    setToggling(true)
    setError(null)
    try {
      const data = await api.updateRiderStatus(next)
      setRider(data.rider)
      if (next === 'offline') setRequests([])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setToggling(false)
    }
  }

  async function act(
    rideId: string,
    action: 'accept' | 'start' | 'complete',
    fn: (id: string) => Promise<{ ride: Ride }>,
  ) {
    if (busyAction) return
    setBusyAction(rideId)
    setError(null)
    try {
      const data = await fn(rideId)
      setRide(data.ride)
      setRequests((prev) => prev.filter((r) => r.id !== rideId))
      if (action === 'accept') {
        setRider((prev) => (prev ? { ...prev, availability_status: 'busy' } : prev))
      }
      if (action === 'complete') {
        setRide(null)
        setRider((prev) => (prev ? { ...prev, availability_status: 'online' } : prev))
      }
    } catch (err) {
      setError((err as Error).message)
      // The request likely got taken by someone else — refresh the list.
      api
        .nearbyRideRequests()
        .then((d) => setRequests(d.requests))
        .catch(() => {})
    } finally {
      setBusyAction(null)
    }
  }

  const center = useMemo<[number, number] | null>(() => {
    if (rideActive && ride) return [ride.pickupLatitude, ride.pickupLongitude]
    if (position) return [position.coords.latitude, position.coords.longitude]
    return null
  }, [rideActive, ride?.pickupLatitude, ride?.pickupLongitude, position])

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = []
    if (rideActive && ride) {
      list.push({
        id: 'pickup',
        position: [ride.pickupLatitude, ride.pickupLongitude],
        label: `Pickup — ${ride.customer.name}`,
        kind: 'pickup',
      })
      if (position) {
        list.push({
          id: 'me',
          position: [position.coords.latitude, position.coords.longitude],
          label: 'You (live GPS)',
          kind: 'rider',
        })
      }
    } else if (center) {
      list.push({ id: 'me', position: center, label: 'You (live GPS)', kind: 'rider' })
    }
    return list
  }, [rideActive, ride, position, center])

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

        <section className="dash-card">
          <div className="dash-status-head">
            <h1 className="dash-title">Rider Status</h1>
            <span className={`dash-status-pill ${online ? 'online' : status === 'busy' ? 'busy' : 'offline'}`}>
              <i aria-hidden />
              {online ? 'ONLINE' : status === 'busy' ? 'BUSY' : 'OFFLINE'}
            </span>
          </div>

          {!rideActive && (
            <button
              type="button"
              className={online ? 'dash-danger-button' : 'submit-button'}
              onClick={toggleOnline}
              disabled={toggling || !rider}
            >
              {toggling ? 'Updating…' : online ? 'Go Offline' : 'Go Online'}
            </button>
          )}

          {sharingLocation && (
            <p className="dash-info">
              {position
                ? `📍 Sharing location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
                : locError || 'Waiting for GPS fix…'}
            </p>
          )}

          <div className="dash-map">
            {center ? (
              <MapView center={center} markers={markers} />
            ) : (
              <p className="dash-map-empty">
                {sharingLocation
                  ? locError || 'Waiting for GPS fix…'
                  : 'Go online to share your location'}
              </p>
            )}
          </div>
        </section>

        {/* Active ride ------------------------------------------------------ */}
        {rideActive && ride && (
          <section className="dash-card">
            <div className="dash-list-head">
              <h2 className="dash-subtitle">
                {ride.status === 'in_progress' ? '🛵 Ride in progress' : '✅ Ride accepted'}
              </h2>
              {ride.distanceKm != null && (
                <span className="dash-pill">{ride.distanceKm} km to pickup</span>
              )}
            </div>
            <p className="dash-detail-name">Customer: {ride.customer.name}</p>
            <p className="dash-detail-line">📞 {ride.customer.phone}</p>
            <p className="dash-detail-line">
              📍 Pickup: {ride.pickupLatitude.toFixed(5)}, {ride.pickupLongitude.toFixed(5)}
            </p>

            <a
              className="dash-link-button"
              href={`https://www.google.com/maps/dir/?api=1&destination=${ride.pickupLatitude},${ride.pickupLongitude}&travelmode=driving`}
              target="_blank"
              rel="noreferrer"
            >
              Open navigation to customer
            </a>

            {ride.status !== 'in_progress' ? (
              <button
                type="button"
                className="submit-button"
                onClick={() => act(ride.id, 'start', api.startRide)}
                disabled={busyAction === ride.id}
              >
                {busyAction === ride.id ? 'Updating…' : 'Start ride'}
              </button>
            ) : (
              <button
                type="button"
                className="submit-button"
                onClick={() => act(ride.id, 'complete', api.completeRide)}
                disabled={busyAction === ride.id}
              >
                {busyAction === ride.id ? 'Updating…' : 'Complete ride'}
              </button>
            )}
          </section>
        )}

        {rider && (rider.motorcycle_number || rider.motorcycle_model) && !rideActive && (
          <section className="dash-card">
            <h2 className="dash-subtitle">My Motorcycle</h2>
            <p className="dash-detail-line">
              {rider.motorcycle_model || '—'}
              {rider.motorcycle_number && ` (${rider.motorcycle_number})`}
            </p>
          </section>
        )}

        {/* Nearby requests --------------------------------------------------- */}
        {!rideActive && (
          <section className="dash-card">
            <h2 className="dash-subtitle">Nearby Requests</h2>
            {!online ? (
              <p className="dash-empty">
                Go online to see ride requests from customers near you.
              </p>
            ) : requests.length === 0 ? (
              <p className="dash-empty">
                No pending requests nearby right now. Stay online — you'll be notified when a
                customer requests a ride.
              </p>
            ) : (
              <ul className="dash-list">
                {requests.map((req) => (
                  <li key={req.id}>
                    <div className="dash-list-head">
                      <b>👤 {req.customer.name}</b>
                      <span className="dash-pill">{req.distanceKm} km away</span>
                    </div>
                    <p>
                      📍 Pickup: {req.pickupLatitude.toFixed(4)}, {req.pickupLongitude.toFixed(4)}
                    </p>
                    <button
                      type="button"
                      className="submit-button"
                      onClick={() => act(req.id, 'accept', api.acceptRide)}
                      disabled={busyAction === req.id}
                    >
                      {busyAction === req.id ? 'Accepting…' : 'ACCEPT'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
