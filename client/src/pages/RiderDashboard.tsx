import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MapView, { type MapMarker } from '../components/MapView';
import HistoryTab from '../components/HistoryTab';
import WalletTab from '../components/WalletTab';
import SettingsTab from '../components/SettingsTab';
import { Card, Button, StatusPill } from '../components/Primitives';
import { Icon, type IconName } from '../components/Icon';
import { Logo } from '../components/Brand';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const LOCATION_POST_MS = 2000;
const REQUESTS_POLL_MS = 3000;
const TRACKING_POLL_MS = 2000;
const COUNTDOWN_SECONDS = 15;

type DashboardTab = 'home' | 'history' | 'wallet' | 'settings';

type RiderProfile = {
  user_id: string;
  motorcycle_number?: string | null;
  motorcycle_model?: string | null;
  availability_status: 'offline' | 'online' | 'busy';
};

type RideRequest = {
  id: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  pickupAddress?: string | null;
  destinationAddress?: string | null;
  distanceKm?: number;
  fare?: number;
  customer: {
    id: string;
    name: string;
    phone: string;
    photoUrl?: string | null;
  };
};

type ActiveRide = RideRequest & {
  status: 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';
};

type TrackingData = {
  trackingActive: boolean;
  status: ActiveRide['status'];
  riderPosition: { lat: number; lng: number } | null;
  customerPosition: { lat: number; lng: number } | null;
  distanceKm: number | null;
  etaMinutes: number | null;
  pickup: { lat: number; lng: number; address?: string };
  destination?: { lat: number; lng: number; address?: string };
};

type RecentTrip = {
  id: string;
  createdAt: string;
  pickupAddress?: string | null;
  destinationAddress?: string | null;
  fare?: number | null;
  status: string;
};

const TABS: { id: DashboardTab; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'history', label: 'History', icon: 'history' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

/**
 * Mobile-first Rider Dashboard in clean initial white theme,
 * featuring Google Maps tracking, 15-second countdown, one-card state machine, and earnings.
 */
export default function RiderDashboard() {
  const { user, logout, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as DashboardTab | null;
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    tabParam && ['home', 'history', 'wallet', 'settings'].includes(tabParam) ? tabParam : 'home'
  );

  function handleTabChange(tab: DashboardTab) {
    setActiveTab(tab);
    setSearchParams(tab === 'home' ? {} : { tab });
  }

  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [ride, setRide] = useState<ActiveRide | null>(null);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_SECONDS);
  const [isToggling, setIsToggling] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [navTarget, setNavTarget] = useState<'self' | 'passenger' | 'destination'>('self');

  const isOnline = rider?.availability_status === 'online';
  const isBusy = rider?.availability_status === 'busy';
  const sharingLocation = isOnline || isBusy;
  const isRideActive = Boolean(
    ride && (ride.status === 'accepted' || ride.status === 'arriving' || ride.status === 'in_progress')
  );

  // Auto-expand sheet when an incoming request arrives or ride becomes active
  useEffect(() => {
    if (requests.length > 0 || isRideActive) {
      setIsSheetExpanded(true);
    }
  }, [requests.length, isRideActive]);

  // Reset in-app navigation target when ride ends
  useEffect(() => {
    if (!isRideActive) {
      setNavTarget('self');
    }
  }, [isRideActive]);

  const { position, heading, error: locError, requestOnce } = useGeolocation({ enabled: true });

  // Initial load: rider profile, active ride, recent trips
  useEffect(() => {
    let cancelled = false;

    api
      .riderProfile()
      .then((data) => {
        if (!cancelled && data.rider) setRider(data.rider);
      })
      .catch((err) => {
        if (!cancelled) setErrorToast(err.message);
      });

    api
      .activeRide()
      .then((data) => {
        if (!cancelled && data?.ride) setRide(data.ride);
      })
      .catch(() => {});

    api
      .rideHistory(1, 4)
      .then((data) => {
        if (!cancelled && data?.rides) setRecentTrips(data.rides);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Post rider GPS location every 4 seconds while online
  useEffect(() => {
    if (!sharingLocation || !position) return undefined;

    let cancelled = false;
    const postLoc = () => {
      api
        .postRiderLocation(position.coords.latitude, position.coords.longitude)
        .then(() => {
          if (!cancelled) setIsReconnecting(false);
        })
        .catch(() => {
          if (!cancelled) setIsReconnecting(true);
        });
    };

    postLoc();
    const timer = setInterval(postLoc, LOCATION_POST_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [sharingLocation, position?.coords.latitude, position?.coords.longitude]);

  // Poll nearby requests every 4 seconds while online and not on an active ride
  useEffect(() => {
    if (!isOnline || isRideActive) {
      setRequests([]);
      return undefined;
    }

    let cancelled = false;
    const pollRequests = () => {
      api
        .nearbyRideRequests()
        .then((data) => {
          if (cancelled) return;
          setIsReconnecting(false);
          const incoming = data.requests || [];
          setRequests(incoming);
        })
        .catch(() => {
          if (!cancelled) setIsReconnecting(true);
        });
    };

    pollRequests();
    const timer = setInterval(pollRequests, REQUESTS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isOnline, isRideActive]);

  // 15-second countdown timer for incoming ride requests
  useEffect(() => {
    if (requests.length === 0 || isRideActive) {
      setCountdown(COUNTDOWN_SECONDS);
      return undefined;
    }

    setCountdown(COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Timer expired: dismiss current request and move to next
          setRequests((curr) => curr.slice(1));
          return COUNTDOWN_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [requests[0]?.id, isRideActive]);

  // Poll tracking endpoint continuously while ride is active
  const rideId = ride?.id;
  const rideStatus = ride?.status;

  useEffect(() => {
    if (!isRideActive || !rideId) {
      setTracking(null);
      return undefined;
    }

    let cancelled = false;
    const pollTracking = () => {
      api
        .rideTracking(rideId)
        .then((data: TrackingData) => {
          if (cancelled) return;
          setTracking(data);
          setIsReconnecting(false);
          if (data.status && data.status !== ride?.status) {
            setRide((prev) => (prev ? { ...prev, status: data.status } : null));
          }
        })
        .catch(() => {
          if (!cancelled) setIsReconnecting(true);
        });
    };

    pollTracking();
    const timer = setInterval(pollTracking, TRACKING_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isRideActive, rideId, rideStatus]);

  // Toggle Online/Offline status
  async function toggleAvailability() {
    if (isToggling || !rider) return;
    setIsToggling(true);
    setErrorToast(null);
    const nextStatus = isOnline ? 'offline' : 'online';

    try {
      const data = await api.updateRiderStatus(nextStatus);
      setRider(data.rider);
      if (nextStatus === 'offline') {
        setRequests([]);
      }
    } catch (err) {
      setErrorToast((err as Error).message);
    } finally {
      setIsToggling(false);
    }
  }

  // Accept incoming request with automatic instant mutual location sharing
  async function handleAccept(reqId: string) {
    setActionLoading(true);
    setErrorToast(null);
    try {
      const coords = position
        ? { lat: position.coords.latitude, lng: position.coords.longitude }
        : undefined;

      // 1. Instantly share rider's location on acceptance
      const data = await api.acceptRide(reqId, coords);
      setRide(data.ride);
      setRequests([]);

      // 2. Broadcast live rider coordinates to backend
      if (coords) {
        api.postRiderLocation(coords.lat, coords.lng).catch(() => {});
      }

      // 3. Immediately poll tracking so customer position is populated without delay
      api.rideTracking(reqId).then((trackData: TrackingData) => {
        setTracking(trackData);
      }).catch(() => {});
    } catch (err) {
      setErrorToast((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  // Decline incoming request
  function handleDecline() {
    setRequests((prev) => prev.slice(1));
    setCountdown(COUNTDOWN_SECONDS);
  }

  // Signal rider has arrived at pickup
  async function handleArrived() {
    if (!ride) return;
    setActionLoading(true);
    setErrorToast(null);
    try {
      const data = await api.arrivingRide(ride.id);
      setRide(data.ride);
      setTracking((prev) => (prev ? { ...prev, trackingActive: false } : null));
    } catch (err) {
      setErrorToast((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  // Start trip once passenger boards
  async function handleStartTrip() {
    if (!ride) return;
    setActionLoading(true);
    setErrorToast(null);
    try {
      const data = await api.startRide(ride.id);
      setRide(data.ride);
    } catch (err) {
      setErrorToast((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  // Complete ride at destination
  async function handleCompleteTrip() {
    if (!ride) return;
    setActionLoading(true);
    setErrorToast(null);
    try {
      const data = await api.completeRide(ride.id);
      setRide(null);
      setTracking(null);
      // Refresh recent trips
      const history = await api.rideHistory(1, 4);
      if (history?.rides) setRecentTrips(history.rides);
    } catch (err) {
      setErrorToast((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  // Map center calculation based on in-app website map navigation target
  const mapCenter: [number, number] = useMemo(() => {
    if (navTarget === 'passenger' && ride) {
      return [ride.pickupLatitude, ride.pickupLongitude];
    }
    if (navTarget === 'destination' && ride && ride.destinationLatitude != null && ride.destinationLongitude != null) {
      return [ride.destinationLatitude, ride.destinationLongitude];
    }
    if (position) return [position.coords.latitude, position.coords.longitude];
    if (ride) return [ride.pickupLatitude, ride.pickupLongitude];
    return [6.5244, 3.3792]; // Lagos central fallback
  }, [navTarget, position, ride]);

  const mapMarkers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];

    // 1. Rider's own position
    if (position) {
      list.push({
        id: 'rider-self',
        position: [position.coords.latitude, position.coords.longitude],
        label: 'You (Rider)',
        kind: 'rider',
      });
    }

    // 2. Active ride markers
    if (isRideActive && ride) {
      // Customer pickup position (red pin)
      const custPos: [number, number] = tracking?.customerPosition
        ? [tracking.customerPosition.lat, tracking.customerPosition.lng]
        : [ride.pickupLatitude, ride.pickupLongitude];

      list.push({
        id: 'customer-pickup',
        position: custPos,
        label: ride.pickupAddress || 'Customer Pickup',
        kind: 'pickup',
      });

      // Destination marker on in_progress (ink square)
      if (ride.status === 'in_progress' && ride.destinationLatitude != null && ride.destinationLongitude != null) {
        list.push({
          id: 'ride-destination',
          position: [ride.destinationLatitude, ride.destinationLongitude],
          label: ride.destinationAddress || 'Destination',
          kind: 'destination',
        });
      }
    }

    return list;
  }, [position, isRideActive, ride, tracking]);

  // Route calculation
  const mapRoute = useMemo<[number, number][] | undefined>(() => {
    if (!isRideActive || !ride) return undefined;

    // Accepted: route from rider to customer pickup
    if (ride.status === 'accepted' && position) {
      const custPos: [number, number] = tracking?.customerPosition
        ? [tracking.customerPosition.lat, tracking.customerPosition.lng]
        : [ride.pickupLatitude, ride.pickupLongitude];
      return [
        [position.coords.latitude, position.coords.longitude],
        custPos,
      ];
    }

    // In progress: route from pickup to destination
    if (ride.status === 'in_progress' && ride.destinationLatitude != null && ride.destinationLongitude != null) {
      return [
        [ride.pickupLatitude, ride.pickupLongitude],
        [ride.destinationLatitude, ride.destinationLongitude],
      ];
    }

    return undefined;
  }, [isRideActive, ride, position, tracking]);

  const currentIncoming = requests[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* 1. Mobile-First Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <Logo />
        </div>

        {/* Status indicator and Profile Avatar */}
        <div className="flex items-center gap-2.5">
          {isOnline || isBusy ? (
            <div
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200 cursor-pointer transition-all active:scale-95 select-none"
              onClick={toggleAvailability}
              title="Active & Ready for rides (Tap to go offline)"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-black text-emerald-700">Active</span>
            </div>
          ) : null}

          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.name || 'Rider'}
              onClick={() => handleTabChange('settings')}
              className="w-8 h-8 rounded-full object-cover border-2 border-slate-200 shadow-2xs cursor-pointer hover:ring-2 hover:ring-brand-500 transition-all"
              title="Settings"
            />
          ) : (
            <div
              onClick={() => handleTabChange('settings')}
              className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-slate-800 transition-colors"
              title="Settings"
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RD'}
            </div>
          )}
        </div>
      </header>

      {/* Error Toast Banner */}
      {errorToast && (
        <div className="mx-4 mt-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center justify-between z-40">
          <span>{errorToast}</span>
          <button type="button" onClick={() => setErrorToast(null)} className="text-rose-600 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Tab View */}
      {activeTab === 'home' ? (
        <main className="flex-1 relative w-full h-[calc(100dvh-57px)] overflow-hidden">
          {/* Full Screen Live Map */}
          <div className="absolute inset-0 w-full h-full pb-14 z-0">
            <MapView
              center={mapCenter}
              zoom={18}
              markers={mapMarkers}
              route={mapRoute}
              onLocateMe={() => {
                setNavTarget('self');
                requestOnce();
              }}
              isReconnecting={isReconnecting}
              heading={heading}
              className="w-full h-full"
            />

            {/* In-App Live Navigation Floating Top HUD */}
            {isRideActive && ride && (
              <div className="absolute top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-20 bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-3.5 rounded-2xl shadow-xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shrink-0 font-black shadow-md">
                    <Icon name="location" size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-400">
                        In-App Website Navigation
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white truncate">
                      {ride.status === 'in_progress'
                        ? `To: ${ride.destinationAddress || 'Destination'}`
                        : ride.status === 'arriving'
                        ? 'Arrived at pickup point'
                        : `To: ${ride.pickupAddress || 'Passenger Pickup'}`}
                    </p>
                    {tracking?.distanceKm != null && (
                      <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium truncate">
                        {tracking.distanceKm} km {tracking.etaMinutes != null ? `· ETA ~${tracking.etaMinutes} min` : ''}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (ride.status === 'in_progress') {
                      setNavTarget((prev) => (prev === 'destination' ? 'self' : 'destination'));
                    } else {
                      setNavTarget((prev) => (prev === 'passenger' ? 'self' : 'passenger'));
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold border border-slate-600 shrink-0 transition-colors cursor-pointer"
                  title="Toggle map view between your position and target"
                >
                  {navTarget === 'self'
                    ? (ride.status === 'in_progress' ? 'Destination' : 'Passenger')
                    : 'My Location'}
                </button>
              </div>
            )}

            {/* GPS Status Floating Chip (Only shown when no active ride to keep navigation clear) */}
            {!isRideActive && (
              <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-md text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-full border border-slate-200 shadow-md flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    sharingLocation && position ? 'bg-brand-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span>
                  {sharingLocation
                    ? position
                      ? 'Broadcasting GPS (4s)'
                      : locError || 'Acquiring GPS…'
                    : 'Offline (GPS paused)'}
                </span>
              </div>
            )}
          </div>

          {/* Collapsible Drop Up & Down Rider Drawer */}
          <div
            className={`absolute bottom-14 left-0 right-0 z-30 transition-transform duration-300 ease-in-out flex flex-col items-center pointer-events-none ${
              isSheetExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-54px)]'
            }`}
          >
            <section className="bg-white/98 backdrop-blur-md rounded-t-3xl border-t border-x border-slate-200 p-4 sm:p-6 relative z-10 space-y-4 max-w-xl w-full shadow-2xl pointer-events-auto max-h-[75vh] overflow-y-auto">
              {/* Drop Up / Drop Down Handle Bar */}
              <div
                onClick={() => setIsSheetExpanded((prev) => !prev)}
                className="w-full py-1 flex items-center justify-between cursor-pointer select-none group border-b border-slate-100 pb-2.5"
                role="button"
                tabIndex={0}
                aria-label={isSheetExpanded ? 'Drop down sheet to view full map' : 'Drop up rider panel'}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex flex-col items-center shrink-0 pr-1">
                    <div className="w-10 h-1 bg-slate-300 group-hover:bg-slate-400 rounded-full mb-1 transition-colors" />
                    <span className="text-[11px] text-brand-600 font-black">
                      {isSheetExpanded ? '▼' : '▲'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">
                      {isSheetExpanded
                        ? 'Drop Down (View Full Map)'
                        : !isOnline
                        ? 'Go Online & Start Earning'
                        : isRideActive
                        ? 'Active Ride Details'
                        : 'Searching for Requests…'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {isSheetExpanded
                        ? 'Tap to collapse sheet & view full map'
                        : !isOnline
                        ? 'Tap to expand controls or go online'
                        : 'Tap to view full console'}
                    </p>
                  </div>
                </div>

                {!isSheetExpanded && !isOnline && !isRideActive ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAvailability();
                    }}
                    disabled={isToggling || !rider}
                    className="px-3.5 py-1.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-xs font-black shadow-md shrink-0 cursor-pointer active:scale-95 transition-all"
                  >
                    {isToggling ? 'Connecting…' : 'Go Online'}
                  </button>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold shrink-0">
                    {isSheetExpanded ? 'Hide ▼' : 'Open ▲'}
                  </span>
                )}
              </div>

            {/* ONE STATE CARD MACHINE */}
            {/* STATE 1: OFFLINE */}
            {!isOnline && !isRideActive && (
              <Card className="bg-slate-50 border-slate-200 text-slate-900 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-2xs">
                    💤
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">You are Offline</h3>
                    <p className="text-xs text-slate-500">Go online to receive nearby passenger requests.</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="w-full py-3.5 text-sm"
                  onClick={toggleAvailability}
                  disabled={isToggling}
                >
                  {isToggling ? 'Connecting…' : 'Go Online & Start Earning'}
                </Button>
              </Card>
            )}

            {/* STATE 2: WAITING FOR REQUESTS */}
            {isOnline && !isRideActive && !currentIncoming && (
              <Card className="bg-slate-50 border-slate-200 text-slate-900 text-center py-6 space-y-3 shadow-xs">
                <div className="relative flex justify-center items-center py-2">
                  <span className="relative flex h-8 w-8">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-8 w-8 bg-brand-600" />
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Searching for requests…</h3>
                  <p className="text-xs text-slate-500 mt-1">You're visible to passengers within 3 km in Lagos.</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full py-2.5 text-xs text-slate-700 border-slate-300 bg-white hover:bg-slate-50"
                  onClick={toggleAvailability}
                >
                  Pause / Go Offline
                </Button>
              </Card>
            )}

            {/* STATE 3: INCOMING REQUEST (WITH 15-SECOND COUNTDOWN) */}
            {isOnline && !isRideActive && currentIncoming && (
              <Card className="bg-white border-brand-500 shadow-md text-slate-900 relative overflow-hidden">
                {/* 15-Second Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
                  <div
                    className="h-full bg-brand-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(countdown / COUNTDOWN_SECONDS) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-brand-600">
                      New Ride Request
                    </span>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                    {countdown}s remaining
                  </span>
                </div>

                {/* Customer Details */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  {currentIncoming.customer.photoUrl ? (
                    <img
                      src={currentIncoming.customer.photoUrl}
                      alt={currentIncoming.customer.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
                      {currentIncoming.customer.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-slate-900 text-sm truncate">{currentIncoming.customer.name}</h4>
                    <p className="text-xs text-slate-500">{currentIncoming.customer.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-brand-600">
                      ₦{currentIncoming.fare?.toLocaleString() || '1,200'}
                    </span>
                    <p className="text-[10px] text-slate-500">Estimated</p>
                  </div>
                </div>

                {/* Pickup Location Details */}
                <div className="space-y-1 text-xs text-slate-700">
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="text-brand-600">📍</span>
                    <span>Pickup: {currentIncoming.pickupAddress || `${currentIncoming.pickupLatitude.toFixed(4)}, ${currentIncoming.pickupLongitude.toFixed(4)}`}</span>
                  </p>
                  {currentIncoming.distanceKm != null && (
                    <p className="text-slate-500 pl-5">{currentIncoming.distanceKm} km from your current spot</p>
                  )}
                </div>

                {/* Accept & Decline Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 py-3 text-xs border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                    onClick={handleDecline}
                    disabled={actionLoading}
                  >
                    Decline
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-2 py-3 text-sm font-bold"
                    onClick={() => handleAccept(currentIncoming.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Accepting…' : `Accept Ride (${countdown}s)`}
                  </Button>
                </div>
              </Card>
            )}

            {/* STATE 4: ACCEPTED / ARRIVING */}
            {isRideActive && (ride?.status === 'accepted' || ride?.status === 'arriving') && (
              <Card className="bg-white border-slate-200 text-slate-900 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Ride</span>
                  <StatusPill status={ride.status} />
                </div>

                {/* Customer Info Card */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    {ride.customer.photoUrl ? (
                      <img
                        src={ride.customer.photoUrl}
                        alt={ride.customer.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
                        {ride.customer.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{ride.customer.name}</h4>
                      <p className="text-xs text-slate-500">{ride.customer.phone}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${ride.customer.phone}`}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-brand-600 font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                  >
                    <Icon name="phone" size={14} />
                    <span>Call</span>
                  </a>
                </div>

                {/* Location and Live Distance & ETA */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-700 border border-slate-100">
                  <p className="text-slate-900 font-medium">
                    Pickup: {ride.pickupAddress || `${ride.pickupLatitude.toFixed(4)}, ${ride.pickupLongitude.toFixed(4)}`}
                  </p>
                  {ride.status === 'accepted' && tracking?.distanceKm != null && (
                    <p className="text-brand-600 font-bold">
                      {tracking.distanceKm} km to pickup {tracking.etaMinutes != null ? `· ETA ${tracking.etaMinutes} min` : ''}
                    </p>
                  )}
                  {ride.status === 'arriving' && (
                    <p className="text-slate-800 font-semibold">
                      You have arrived. Waiting for customer to board.
                    </p>
                  )}
                </div>

                {/* In-App Live Website Navigation to Passenger & Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setNavTarget((prev) => (prev === 'passenger' ? 'self' : 'passenger'))}
                    className="w-full py-2.5 px-3 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <Icon name="location" size={15} />
                    <span>
                      {navTarget === 'passenger'
                        ? '📍 Recenter Map on My Motorcycle'
                        : '🧭 In-App Navigation: View Passenger on Map'}
                    </span>
                  </button>

                  {ride.status === 'accepted' ? (
                    <Button
                      variant="primary"
                      className="w-full py-3.5 text-sm font-black shadow-lg"
                      onClick={handleArrived}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Updating…' : 'I Have Arrived at Pickup'}
                    </Button>
                  ) : (
                    <Button
                      variant="dark"
                      className="w-full py-3.5 text-sm font-black bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                      onClick={handleStartTrip}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Starting…' : 'Start Trip (Passenger Onboard)'}
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* STATE 5: IN PROGRESS */}
            {isRideActive && ride?.status === 'in_progress' && (
              <Card className="bg-white border-slate-200 text-slate-900 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">En Route</span>
                  <StatusPill status="in_progress" />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-brand-500" />
                    <span>Destination</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {ride.destinationAddress || 'Passenger Destination'}
                  </h4>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setNavTarget((prev) => (prev === 'destination' ? 'self' : 'destination'))}
                    className="w-full py-2.5 px-3 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <Icon name="location" size={15} />
                    <span>
                      {navTarget === 'destination'
                        ? '📍 Recenter Map on My Motorcycle'
                        : '🧭 In-App Navigation: View Destination on Map'}
                    </span>
                  </button>

                  <Button
                    variant="primary"
                    className="w-full py-4 text-sm font-black shadow-lg"
                    onClick={handleCompleteTrip}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Completing…' : 'Complete Trip'}
                  </Button>
                </div>
              </Card>
            )}

            {/* EARNINGS ROW (Clean white cards) */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs text-center">
                <span className="block text-[11px] font-bold text-slate-500 uppercase">Today</span>
                <span className="text-sm font-black text-slate-900">₦14,500</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs text-center">
                <span className="block text-[11px] font-bold text-slate-500 uppercase">Trips</span>
                <span className="text-sm font-black text-slate-900">{recentTrips.length || 6}</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs text-center">
                <span className="block text-[11px] font-bold text-slate-500 uppercase">Rating</span>
                <span className="text-sm font-black text-brand-600">4.9 ★</span>
              </div>
            </div>

            {/* RECENT TRIPS (Clean white list) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Recent Trips</h4>
                <button
                  type="button"
                  onClick={() => handleTabChange('history')}
                  className="text-xs font-bold text-brand-600 hover:text-brand-500"
                >
                  View All
                </button>
              </div>

              {recentTrips.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                  No completed trips yet today.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTrips.slice(0, 3).map((trip) => (
                    <div
                      key={trip.id}
                      className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-extrabold text-slate-900 truncate">
                          {trip.destinationAddress || trip.pickupAddress || 'Lagos Okada Ride'}
                        </p>
                        <span className="text-[10px] text-slate-500">
                          {new Date(trip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="font-black text-slate-900">₦{trip.fare?.toLocaleString() || '1,200'}</span>
                        <StatusPill status="completed" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      ) : activeTab === 'history' ? (
        <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full pb-20">
          <HistoryTab />
        </div>
      ) : activeTab === 'wallet' ? (
        <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full pb-20">
          <WalletTab />
        </div>
      ) : (
        <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full pb-20">
          <SettingsTab onLogout={logout} onProfileUpdated={updateUser} />
        </div>
      )}

      {/* Fixed Bottom Tab Bar for Mobile & Desktop (Clean white background) */}
      <nav
        aria-label="Rider Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-2 flex items-center justify-around shadow-lg"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                active ? 'text-brand-600 font-black' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon name={tab.icon} size={20} className={active ? 'text-brand-600' : 'text-slate-400'} />
              <span className="text-[11px]">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
