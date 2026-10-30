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

const LOCATION_POST_MS = 2500;
const NEARBY_POLL_MS = 3000;
const TRACKING_POLL_MS = 2000;

type DashboardTab = 'home' | 'history' | 'wallet' | 'settings';

type ActiveRide = {
  id: string;
  status: 'pending' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';
  pickupLatitude: number;
  pickupLongitude: number;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  pickupAddress?: string | null;
  destinationAddress?: string | null;
  distanceKm?: number | null;
  fare?: number | null;
  rider: {
    id: string;
    name: string;
    phone: string;
    photoUrl?: string | null;
    motorcycleNumber?: string | null;
    motorcycleModel?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
};

type AnonymousNearbyRider = {
  id: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  name?: string | null;
  motorcycleModel?: string | null;
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
  rider?: {
    id?: string;
    name: string;
    phone?: string;
    motorcycleNumber?: string | null;
    motorcycleModel?: string | null;
    photoUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
};

const geocodeCache = new Map<string, string>();

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;

  // Recognize exact Otukpo / LEEF Center area from GPS fix
  if (lat >= 7.185 && lat <= 7.198 && lng >= 8.128 && lng <= 8.138) {
    const formatted = 'LEEF Center, Otukpo, Benue';
    geocodeCache.set(key, formatted);
    return formatted;
  }

  // 1. High-precision BigDataCloud reverse geocode (free, fast, no API key required)
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || data.city || '';
      const state = data.principalSubdivision || '';
      const parts = [locality, state].filter(Boolean);
      if (parts.length > 0) {
        const unique = Array.from(new Set(parts)).join(', ');
        geocodeCache.set(key, unique);
        return unique;
      }
    }
  } catch {
    // fallback to nominatim
  }

  // 2. OpenStreetMap Nominatim fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'OkadaConnect/1.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const road = addr.road || addr.pedestrian || addr.suburb || data.name || '';
      const area = addr.suburb || addr.neighbourhood || addr.city || addr.county || '';
      const formatted = [road, area].filter(Boolean).join(', ');
      if (formatted) {
        geocodeCache.set(key, formatted);
        return formatted;
      }
    }
  } catch {
    // fallback
  }

  const fallback = `Building (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
  geocodeCache.set(key, fallback);
  return fallback;
}

function computeHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(0.2, Math.round(R * c * 10) / 10);
}

function computeOkadaFare(distKm: number): number {
  return Math.max(500, Math.round((500 + distKm * 150) / 50) * 50);
}

function computeOkadaEta(distKm: number): number {
  return Math.max(3, Math.round((distKm / 25) * 60));
}

const OTUKPO_POPULAR_DESTINATIONS = [
  { name: 'Federal University of Health Sciences (FUHSO)', address: 'FUHSO Campus, Otukpo', lat: 7.1950, lng: 8.1390, icon: '🎓' },
  { name: 'St. Helen Specialist Hospital', address: 'Hospital Road, Otukpo', lat: 7.1880, lng: 8.1310, icon: '🏥' },
  { name: 'Sunrise Hotel Otukpo', address: 'Sunrise St, Otukpo', lat: 7.1970, lng: 8.1360, icon: '🏨' },
  { name: 'Palm Resorts, Otukpo', address: 'Old Enugu Rd, Otukpo', lat: 7.1920, lng: 8.1250, icon: '🌴' },
  { name: '25th May Resort', address: 'Near LEEF Center, Otukpo', lat: 7.1905, lng: 8.1345, icon: '🍹' },
  { name: 'Otukpo Central Market & Motor Park', address: 'Market Road, Otukpo', lat: 7.1850, lng: 8.1300, icon: '🛒' },
  { name: 'Benue State Library, Otukpo', address: 'Library Junction, Otukpo', lat: 7.1960, lng: 8.1330, icon: '📚' },
  { name: 'Abglo Top Hotel / GRA', address: 'GRA Sector, Otukpo', lat: 7.1945, lng: 8.1380, icon: '🏨' },
];

const LAGOS_POPULAR_DESTINATIONS = [
  { name: 'Victoria Island (VI)', address: 'Adeola Odeku St / Eko Hotel', lat: 6.4281, lng: 3.4219, icon: '🏢' },
  { name: 'Lekki Phase 1', address: 'Admiralty Way / Circle Mall', lat: 6.4474, lng: 3.4723, icon: '🌴' },
  { name: 'Marina / CMS Bus Terminal', address: 'Broad St / CMS Jetty, Lagos Island', lat: 6.4531, lng: 3.3958, icon: '🚢' },
  { name: 'Yaba Tech / Commercial Ave', address: 'Herbert Macaulay Way, Yaba', lat: 6.5186, lng: 3.3768, icon: '🎓' },
  { name: 'Ikeja City Mall (ICM)', address: 'Obafemi Awolowo Way, Alausa', lat: 6.6186, lng: 3.3582, icon: '🛍️' },
  { name: 'Balogun Market', address: 'Broad Street / Balogun, Lagos Island', lat: 6.4560, lng: 3.3880, icon: '🛒' },
  { name: 'General Hospital Lagos', address: 'Hospital Road, Lagos Island', lat: 6.4520, lng: 3.3910, icon: '🏥' },
  { name: 'Murtala Muhammed Airport (MMA2)', address: 'Airport Road, Ikeja', lat: 6.5774, lng: 3.3211, icon: '✈️' },
  { name: 'Surulere National Stadium', address: 'Western Ave / Ojuelegba', lat: 6.5020, lng: 3.3580, icon: '🌉' },
  { name: 'Ikoyi - Kingsway Road', address: 'Alfred Rewane / Osborne', lat: 6.4540, lng: 3.4350, icon: '🏛️' },
];

function getRegionalDestinations(lat: number, lng: number) {
  // If in Otukpo / Benue State
  if (lat >= 7.0 && lat <= 7.6 && lng >= 7.8 && lng <= 8.5) {
    return OTUKPO_POPULAR_DESTINATIONS;
  }
  // If in Lagos State
  if (lat >= 6.3 && lat <= 6.8 && lng >= 3.1 && lng <= 3.7) {
    return LAGOS_POPULAR_DESTINATIONS;
  }
  // Generic nearby landmarks relative to GPS coordinates
  return [
    { name: 'City Central Commercial Center', address: 'Main Commercial Ave', lat: lat + 0.012, lng: lng + 0.008, icon: '🏢' },
    { name: 'General Hospital & Medical Care', address: 'Hospital Boulevard', lat: lat - 0.009, lng: lng - 0.007, icon: '🏥' },
    { name: 'Regional Bus Terminal & Motor Park', address: 'Expressway Junction', lat: lat + 0.015, lng: lng - 0.011, icon: '🚌' },
    { name: 'Main Community Market Square', address: 'Market Road', lat: lat - 0.014, lng: lng + 0.012, icon: '🛒' },
  ];
}

const TABS: { id: DashboardTab; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Book Ride', icon: 'home' },
  { id: 'history', label: 'History', icon: 'history' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

/**
 * Desktop-first Customer Dashboard with split-screen booking interface,
 * Google Maps integration, mutual tracking, and real-time ETA updates.
 */
export default function CustomerDashboard() {
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

  const [pickup, setPickup] = useState<[number, number] | null>(null);
  const [pickupAddress, setPickupAddress] = useState<string>('Current Location');
  const [detectedAddress, setDetectedAddress] = useState<string>('');
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [destinationAddress, setDestinationAddress] = useState<string>('Victoria Island (VI)');
  const [nearbyRiders, setNearbyRiders] = useState<AnonymousNearbyRider[]>([]);
  const [ride, setRide] = useState<ActiveRide | null>(null);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [isBookingExpanded, setIsBookingExpanded] = useState(true);

  const { position, heading, error: locError, requestOnce } = useGeolocation();
  const [hasManuallyPickedLocation, setHasManuallyPickedLocation] = useState(false);

  const isRideActive = Boolean(
    ride &&
      (ride.status === 'pending' ||
        ride.status === 'accepted' ||
        ride.status === 'arriving' ||
        ride.status === 'in_progress')
  );

  useEffect(() => {
    if (isRideActive) {
      setIsBookingExpanded(true);
    }
  }, [isRideActive]);

  // Live GPS movement tracker: reverse geocode to real street & building
  useEffect(() => {
    if (position && !hasManuallyPickedLocation && !isRideActive) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setPickup([lat, lng]);

      reverseGeocode(lat, lng).then((addr) => {
        setDetectedAddress(addr);
        setPickupAddress(addr);
      });
    }
  }, [position?.coords.latitude, position?.coords.longitude, hasManuallyPickedLocation, isRideActive]);

  const effectivePickup: [number, number] = useMemo(() => {
    if (ride) return [ride.pickupLatitude, ride.pickupLongitude];
    if (pickup) return pickup;
    if (position) return [position.coords.latitude, position.coords.longitude];
    return [6.5244, 3.3792]; // Lagos default
  }, [ride, pickup, position]);

  // Proximity-based destination suggestions dynamically calculated from live GPS
  const destinationSuggestions = useMemo(() => {
    const list = getRegionalDestinations(effectivePickup[0], effectivePickup[1]);
    return list
      .map((dest) => {
        const distKm = computeHaversineKm(effectivePickup[0], effectivePickup[1], dest.lat, dest.lng);
        const fare = computeOkadaFare(distKm);
        const eta = computeOkadaEta(distKm);
        return {
          ...dest,
          distKm,
          fare,
          eta,
        };
      })
      .sort((a, b) => a.distKm - b.distKm);
  }, [effectivePickup]);

  // Automatically sync initial destination with nearest regional spot
  useEffect(() => {
    if (!destination && destinationSuggestions.length > 0) {
      const first = destinationSuggestions[0];
      setDestination([first.lat, first.lng]);
      setDestinationAddress(first.name);
    }
  }, [destination, destinationSuggestions]);

  const currentDistanceKm = useMemo(() => {
    if (destination) {
      return computeHaversineKm(effectivePickup[0], effectivePickup[1], destination[0], destination[1]);
    }
    return 3.4;
  }, [effectivePickup, destination]);

  const currentFare = useMemo(() => {
    return computeOkadaFare(currentDistanceKm);
  }, [currentDistanceKm]);

  const currentEtaMins = useMemo(() => {
    return computeOkadaEta(currentDistanceKm);
  }, [currentDistanceKm]);

  // Check active ride on initial mount
  useEffect(() => {
    let cancelled = false;
    api
      .activeRide()
      .then((data) => {
        if (!cancelled && data?.ride) setRide(data.ride);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Post customer location every 4s while ride is pending, accepted, or arriving
  useEffect(() => {
    if (!isRideActive || !ride || ride.status === 'in_progress') return undefined;
    if (!position) return undefined;

    let cancelled = false;
    const postLoc = () => {
      api
        .postCustomerLocation(position.coords.latitude, position.coords.longitude)
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
  }, [isRideActive, ride?.status, position?.coords.latitude, position?.coords.longitude]);

  // Poll nearby anonymous riders every 4s when no active ride
  useEffect(() => {
    if (isRideActive || activeTab !== 'home') {
      setNearbyRiders([]);
      return undefined;
    }

    let cancelled = false;
    const fetchNearby = () => {
      api
        .nearbyRiders(effectivePickup[0], effectivePickup[1], 15)
        .then((data) => {
          if (cancelled) return;
          setIsReconnecting(false);
          setNearbyRiders(data.nearbyRiders || data.riders || []);
        })
        .catch(() => {
          if (!cancelled) setIsReconnecting(true);
        });
    };

    fetchNearby();
    const timer = setInterval(fetchNearby, NEARBY_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isRideActive, activeTab, effectivePickup[0], effectivePickup[1]]);

  // Poll tracking endpoint every 2s once a ride is requested/accepted
  const rideId = ride?.id;
  const rideStatus = ride?.status;

  useEffect(() => {
    if (!isRideActive || !rideId) {
      setTracking(null);
      return undefined;
    }

    // Polling active ride tracking (immediate rider pickup and location updates)
    let cancelled = false;
    const pollTracking = () => {
      api
        .rideTracking(rideId)
        .then((data: TrackingData) => {
          if (cancelled) return;
          setTracking(data);
          setIsReconnecting(false);
          if (data.status && data.status !== ride?.status) {
            setRide((prev) => (prev ? { ...prev, status: data.status, rider: (data.rider as any) || prev.rider } : null));
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

  // Request Okada ride
  async function handleRequestRide() {
    if (isCreating || isRideActive) return;
    setIsCreating(true);
    setErrorToast(null);

    try {
      const data = await api.createRide({
        latitude: effectivePickup[0],
        longitude: effectivePickup[1],
        pickupAddress: pickupAddress || detectedAddress || 'Current Location',
        destinationLatitude: destination ? destination[0] : undefined,
        destinationLongitude: destination ? destination[1] : undefined,
        destinationAddress: destinationAddress || undefined,
        fare: currentFare,
      });
      setRide(data.ride);
    } catch (err) {
      setErrorToast((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  }

  // Cancel ride
  async function handleCancelRide() {
    if (!ride || isCancelling) return;
    setIsCancelling(true);
    setErrorToast(null);

    try {
      const data = await api.cancelRide(ride.id);
      setRide(data.ride);
      setTracking(null);
    } catch (err) {
      setErrorToast((err as Error).message);
    } finally {
      setIsCancelling(false);
    }
  }

  // Complete ride when in progress
  async function handleCompleteRide() {
    if (!ride) return;
    try {
      const data = await api.completeRide(ride.id);
      setRide(data.ride);
      setTracking(null);
    } catch (err) {
      setErrorToast((err as Error).message);
    }
  }

  // Map click handler to update pickup
  function handleMapClick(coords: [number, number]) {
    if (isRideActive) return;
    setHasManuallyPickedLocation(true);
    setPickup(coords);
    setPickupAddress(`Selected Building (${coords[0].toFixed(5)}, ${coords[1].toFixed(5)})`);
  }

  function handleResetToGps() {
    setHasManuallyPickedLocation(false);
    requestOnce();
    if (position) {
      setPickup([position.coords.latitude, position.coords.longitude]);
      setPickupAddress(`Current Building (${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)})`);
    }
  }

  const riderDetails = tracking?.rider || ride?.rider;
  const riderLat = ride?.rider?.latitude ?? null;
  const riderLng = ride?.rider?.longitude ?? null;

  // Map markers calculation
  const mapMarkers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];

    // 0. Passenger's own Live GPS location (Google Maps Blue Dot with Flashlight Beam)
    if (position) {
      list.push({
        id: 'customer-self',
        position: [position.coords.latitude, position.coords.longitude],
        label: 'You (Passenger)',
        kind: 'self',
      });
    }

    // 1. Pickup marker: red pin
    list.push({
      id: 'customer-pickup',
      position: effectivePickup,
      label: isRideActive ? 'Your Pickup Spot' : 'Pickup Spot (tap map to move)',
      kind: 'pickup',
    });

    // 2. Destination marker: destination flag
    if (destination) {
      list.push({
        id: 'customer-destination',
        position: destination,
        label: destinationAddress || 'Destination',
        kind: 'destination',
      });
    }

    // 3. Active Ride: assigned rider tracking marker (motorcycle marker gliding to pickup)
    if (isRideActive && ride) {
      if (ride.status === 'accepted' || ride.status === 'arriving') {
        const rPos: [number, number] = tracking?.riderPosition
          ? [tracking.riderPosition.lat, tracking.riderPosition.lng]
          : riderLat != null && riderLng != null
          ? [riderLat, riderLng]
          : [effectivePickup[0] + 0.0065, effectivePickup[1] + 0.0055];

        const distText =
          ride.status === 'arriving'
            ? 'Arrived at pickup!'
            : tracking?.distanceKm != null
            ? `${tracking.distanceKm} km · ETA ${tracking?.etaMinutes || 2}m`
            : 'En route';

        list.push({
          id: 'assigned-rider',
          position: rPos,
          label: `🛵 ${riderDetails?.name || 'Okada Rider'} (${distText})`,
          kind: 'rider',
        });
      } else if (ride.status === 'in_progress') {
        const rPos: [number, number] = tracking?.riderPosition
          ? [tracking.riderPosition.lat, tracking.riderPosition.lng]
          : effectivePickup;

        list.push({
          id: 'assigned-rider-trip',
          position: rPos,
          label: `🛵 ${riderDetails?.name || 'Okada Rider'} (Trip En Route)`,
          kind: 'rider',
        });
      }
    } else {
      // 4. No active ride: show all online available okada riders on the map
      for (const r of nearbyRiders) {
        const labelText = r.name
          ? `🛵 ${r.name} (${r.distanceKm} km away)`
          : `🛵 Available Okada (${r.distanceKm} km away)`;

        list.push({
          id: `nearby-${r.id}`,
          position: [r.latitude, r.longitude],
          label: labelText,
          kind: 'rider',
        });
      }
    }

    return list;
  }, [position, effectivePickup, destination, destinationAddress, isRideActive, ride, tracking, nearbyRiders, riderDetails, riderLat, riderLng]);

  // Route calculation
  const mapRoute = useMemo<[number, number][] | undefined>(() => {
    // If ride is accepted or arriving, draw line connecting rider to pickup spot!
    if (isRideActive && (ride?.status === 'accepted' || ride?.status === 'arriving')) {
      const rPos: [number, number] = tracking?.riderPosition
        ? [tracking.riderPosition.lat, tracking.riderPosition.lng]
        : riderLat != null && riderLng != null
        ? [riderLat, riderLng]
        : [effectivePickup[0] + 0.0065, effectivePickup[1] + 0.0055];

      return [rPos, effectivePickup];
    }

    // If trip is in progress, route from pickup to destination
    if (isRideActive && ride?.status === 'in_progress' && ride.destinationLatitude != null && ride.destinationLongitude != null) {
      return [
        effectivePickup,
        [ride.destinationLatitude, ride.destinationLongitude],
      ];
    }

    // Preview route before request
    if (!isRideActive && destination) {
      return [effectivePickup, destination];
    }

    return undefined;
  }, [isRideActive, ride?.status, ride?.destinationLatitude, ride?.destinationLongitude, tracking?.riderPosition, riderLat, riderLng, effectivePickup, destination]);

  // Full-width or Docked bottom navigation bar
  const renderNavBar = () => (
    <nav
      aria-label="Customer Tabs"
      className="border-t border-slate-200 bg-white shrink-0 py-2.5 px-3 sm:px-6 flex items-center justify-around shadow-lg z-30"
    >
      <div className="max-w-md w-full flex items-center justify-around mx-auto">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-1 px-2 flex flex-col items-center justify-center gap-1 text-[11px] font-extrabold transition-all rounded-xl cursor-pointer ${
                active
                  ? 'text-brand-600 bg-brand-50 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon name={tab.icon} size={18} className={active ? 'text-brand-600' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  return (
    <div className="h-[100dvh] w-screen bg-slate-100 flex flex-col overflow-hidden font-sans text-slate-900">
      {/* Top Header Bar */}
      <header className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 z-30 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <Logo />
        </div>

        <div className="flex items-center gap-2">
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.name || 'User'}
              onClick={() => handleTabChange('settings')}
              className="w-8 h-8 rounded-full object-cover border-2 border-slate-200 shadow-2xs cursor-pointer hover:ring-2 hover:ring-brand-500 transition-all"
              title="Account Settings & Profile Photo"
            />
          ) : (
            <div
              onClick={() => handleTabChange('settings')}
              className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-slate-800 transition-colors"
              title="Account Settings & Profile Photo"
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CU'}
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            title="Log out"
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </header>

      {/* Main Split Layout: Desktop = Sidebar Left / Map Right; Mobile = Map Top (50dvh) / Details Bottom (50dvh) */}
      {activeTab === 'home' ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Sidebar on Desktop / Bottom Controls Drawer on Mobile */}
        <aside
          className={`order-2 md:order-1 w-full md:w-[460px] lg:w-[490px] ${
            isBookingExpanded ? 'h-[50dvh] md:h-full' : 'h-auto md:h-full'
          } bg-white border-t md:border-t-0 md:border-r border-slate-200 flex flex-col z-20 shadow-2xl overflow-hidden shrink-0 transition-all duration-300`}
        >
          {/* Collapsible Drop-down Header Bar for Mobile & Quick Toggling */}
          <button
            type="button"
            onClick={() => setIsBookingExpanded(!isBookingExpanded)}
            className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none transition-colors text-left"
            title={isBookingExpanded ? 'Collapse panel to view full map' : 'Drop down / expand Book Ride panel'}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🛵</span>
              <span className="text-xs font-extrabold text-slate-800">
                {isRideActive
                  ? (ride.status === 'in_progress' ? 'Trip in Progress' : 'Active Ride Details')
                  : 'Book Ride (Drop-down Mode)'}
              </span>
              {!isRideActive && nearbyRiders.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {nearbyRiders.length} Online
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-black text-brand-600">
              <span className="text-[11px]">{isBookingExpanded ? 'Hide' : 'Open'}</span>
              <span className={`inline-block transform transition-transform duration-200 ${isBookingExpanded ? 'rotate-180' : 'rotate-0'}`}>
                ▼
              </span>
            </div>
          </button>

          {/* Error Toast */}
          {errorToast && (
            <div className="m-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center justify-between">
              <span>{errorToast}</span>
              <button type="button" onClick={() => setErrorToast(null)} className="text-rose-500 font-bold ml-2">
                ✕
              </button>
            </div>
          )}

          {/* TAB CONTENT (Hidden on mobile when collapsed so the map takes full screen) */}
          <div className={`flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 ${!isBookingExpanded ? 'hidden md:block' : 'block'}`}>
            {/* Finished / Cancelled Banner */}
              {ride && !isRideActive && (
                <div
                  className={`p-4 rounded-2xl text-center space-y-3 ${
                    ride.status === 'completed'
                      ? 'bg-slate-50 border border-slate-200 text-slate-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  <p className="font-extrabold text-sm">
                    {ride.status === 'completed'
                      ? 'Ride completed. Thank you for riding with Okada Connect!'
                      : 'Ride request was cancelled.'}
                  </p>
                  <Button
                    variant="primary"
                    className="w-full py-3 text-xs"
                    onClick={() => {
                      setRide(null);
                      setTracking(null);
                    }}
                  >
                    Book Another Ride
                  </Button>
                </div>
              )}

              {/* ACTIVE RIDE TIMELINE & RIDER CARD */}
              {isRideActive && ride && (
                <div className="space-y-4">
                  {/* Status Timeline */}
                  <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ride Status</span>
                      <StatusPill status={ride.status} />
                    </div>

                    {/* Timeline Steps */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2">
                      {[
                        { key: 'pending', label: 'Requested' },
                        { key: 'accepted', label: 'Accepted' },
                        { key: 'arriving', label: 'Arrived' },
                        { key: 'in_progress', label: 'En Route' },
                      ].map((step, idx) => {
                        const statusOrder = ['pending', 'accepted', 'arriving', 'in_progress'];
                        const currentIdx = statusOrder.indexOf(ride.status);
                        const isDone = currentIdx >= idx;
                        const isCurrent = ride.status === step.key;

                        return (
                          <div key={step.key} className="text-center space-y-1">
                            <div
                              className={`h-1.5 rounded-full ${
                                isDone ? 'bg-brand-600' : 'bg-slate-200'
                              } ${isCurrent ? 'animate-pulse' : ''}`}
                            />
                            <span
                              className={`text-[10px] block font-bold ${
                                isCurrent ? 'text-brand-600' : isDone ? 'text-slate-800' : 'text-slate-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Informative Status Banner & Pending Cancel */}
                    <div className="p-3 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700">
                      {ride.status === 'pending' && 'Looking for riders nearby… Riders have been alerted.'}
                      {ride.status === 'accepted' &&
                        `Rider accepted! ${
                          tracking?.distanceKm != null ? `${tracking.distanceKm} km away` : 'Approaching'
                        } ${tracking?.etaMinutes != null ? `· ETA ${tracking.etaMinutes} min` : ''}`}
                      {ride.status === 'arriving' && 'Your rider has arrived at the pickup spot!'}
                      {ride.status === 'in_progress' && 'Trip en route to destination.'}
                    </div>

                    {ride.status === 'pending' && (
                      <Button
                        variant="danger"
                        className="w-full py-3 text-xs"
                        onClick={handleCancelRide}
                        disabled={isCancelling}
                      >
                        {isCancelling ? 'Cancelling…' : 'Cancel Request'}
                      </Button>
                    )}
                  </Card>

                  {/* Assigned Rider Card (Visible when accepted, arriving, or in_progress) */}
                  {(ride.status === 'accepted' || ride.status === 'arriving' || ride.status === 'in_progress') && (
                    <Card className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {riderDetails?.photoUrl ? (
                            <img
                              src={riderDetails.photoUrl}
                              alt={riderDetails?.name || 'Rider'}
                              className="w-12 h-12 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                              {riderDetails?.name ? riderDetails.name.slice(0, 2).toUpperCase() : 'OK'}
                            </div>
                          )}
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              {riderDetails?.name || 'Assigned Okada Rider'}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                              {riderDetails?.motorcycleModel || 'Bajaj Boxer'} ·{' '}
                              <span className="font-bold text-slate-800">
                                {riderDetails?.motorcycleNumber || 'LND-492-QA'}
                              </span>
                            </p>
                          </div>
                        </div>

                        {riderDetails?.phone && (
                          <a
                            href={`tel:${riderDetails.phone}`}
                            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-brand-600 transition-colors"
                            title="Call Rider"
                          >
                            <Icon name="phone" size={18} />
                          </a>
                        )}
                      </div>

                      {/* Quick Communication & Live Spot Sharing */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {riderDetails?.phone && (
                          <>
                            <a
                              href={`tel:${riderDetails.phone}`}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                              title="Call Rider"
                            >
                              <Icon name="phone" size={14} />
                              <span>Call Rider</span>
                            </a>
                            <a
                              href={`https://wa.me/${riderDetails.phone.replace(/[^0-9]/g, '')}?text=Hello%20rider,%20I%20am%20waiting%20for%20pickup%20at%20${encodeURIComponent(pickupAddress)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                              title="Chat with Rider"
                            >
                              <span>💬 Chat</span>
                            </a>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            requestOnce();
                            if (position) {
                              api.postCustomerLocation(position.coords.latitude, position.coords.longitude).then(() => {
                                setErrorToast('📍 Shared your exact live GPS spot with your rider!');
                              });
                            }
                          }}
                          className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          title="Broadcast high-accuracy GPS coordinates directly to your rider"
                        >
                          <span>📍 Share Spot</span>
                        </button>
                      </div>

                      {/* Distance & ETA Live Pill */}
                      {ride.status === 'accepted' && tracking?.distanceKm != null && (
                        <div className="flex items-center justify-between p-2.5 bg-brand-50 border border-brand-100 rounded-xl text-xs">
                          <span className="font-bold text-brand-700">Rider Approaching:</span>
                          <span className="font-black text-brand-600">
                            {tracking.distanceKm} km · {tracking.etaMinutes != null ? `ETA ~${tracking.etaMinutes} min` : 'Arriving soon'}
                          </span>
                        </div>
                      )}

                      {/* Cancel / Finish Buttons */}
                      <div className="pt-1">
                        {ride.status === 'accepted' ? (
                          <Button
                            variant="danger"
                            className="w-full py-3 text-xs"
                            onClick={handleCancelRide}
                            disabled={isCancelling}
                          >
                            {isCancelling ? 'Cancelling…' : 'Cancel Ride'}
                          </Button>
                        ) : ride.status === 'in_progress' ? (
                          <Button
                            variant="primary"
                            className="w-full py-3.5 text-xs font-black shadow-md"
                            onClick={handleCompleteRide}
                          >
                            Complete Trip
                          </Button>
                        ) : null}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* BOOKING INPUTS FORM (Disabled while ride is active) */}
              {!isRideActive && (
                <div className="space-y-4">
                  {/* Pickup Input with GPS Tracking Details */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Pickup Location
                      </label>
                      <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Live GPS Active
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-brand-500 focus-within:bg-white transition-all">
                      <span className="text-brand-600 font-black text-sm">📍</span>
                      <input
                        type="text"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-slate-800 flex-1 outline-hidden"
                        placeholder="Detecting pickup spot..."
                      />
                      <button
                        type="button"
                        onClick={handleResetToGps}
                        className="text-[11px] font-bold text-brand-600 hover:text-brand-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1"
                        title="Snap to live GPS location"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                        GPS
                      </button>
                    </div>

                    {/* Detected GPS Landmark / Building Subtext */}
                    {detectedAddress && (
                      <p className="text-[11px] text-slate-500 font-medium px-1 flex items-center gap-1.5">
                        <span className="text-slate-400">🏢 Near:</span>
                        <span className="font-semibold text-slate-700 truncate">{detectedAddress}</span>
                      </p>
                    )}

                    {/* Quick Smart Pickup Spot Chips */}
                    <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-0.5">
                      <span className="text-[10px] text-slate-400 font-bold shrink-0">Suggestions:</span>
                      {[
                        { label: '🚪 Main Gate', suffix: ' (Main Gate)' },
                        { label: '🚏 Bus Stop', suffix: ' (Bus Stop)' },
                        { label: '🛣️ Junction', suffix: ' (Road Junction)' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            const base = detectedAddress ? detectedAddress.split(',')[0] : pickupAddress;
                            setPickupAddress(`${base}${item.suffix}`);
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 shrink-0 cursor-pointer transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Destination Input & Drop-down Mode */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Destination (Drop-down Mode)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowDestinationSuggestions(!showDestinationSuggestions)}
                        className="text-[11px] font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
                      >
                        {showDestinationSuggestions ? 'Hide GPS list' : '✨ View all GPS landmarks'}
                      </button>
                    </div>

                    {/* Instant Drop-down Mode Selector */}
                    <div className="relative">
                      <select
                        aria-label="Select Destination Dropdown"
                        value={
                          destinationSuggestions.some((d) => d.name === destinationAddress)
                            ? destinationAddress
                            : ''
                        }
                        onChange={(e) => {
                          const selected = destinationSuggestions.find((d) => d.name === e.target.value);
                          if (selected) {
                            setDestination([selected.lat, selected.lng]);
                            setDestinationAddress(selected.name);
                          }
                        }}
                        className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:border-brand-500 focus:bg-white transition-all outline-hidden cursor-pointer"
                      >
                        <option value="" disabled>
                          🔽 Select destination from drop-down…
                        </option>
                        {destinationSuggestions.map((dest) => (
                          <option key={dest.name} value={dest.name}>
                            {dest.icon} {dest.name} — {dest.distKm} km (₦{dest.fare.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Manual Custom Destination Address Input */}
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-brand-500 focus-within:bg-white transition-all">
                      <span className="text-slate-800 font-bold text-sm">🏁</span>
                      <input
                        type="text"
                        value={destinationAddress}
                        onChange={(e) => setDestinationAddress(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-slate-800 flex-1 outline-hidden"
                        placeholder="Or type custom destination..."
                      />
                    </div>

                    {/* Nearest GPS Destination Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {destinationSuggestions.slice(0, 4).map((dest) => {
                        const isSelected = destinationAddress === dest.name;
                        return (
                          <button
                            key={dest.name}
                            type="button"
                            onClick={() => {
                              setDestination([dest.lat, dest.lng]);
                              setDestinationAddress(dest.name);
                            }}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{dest.icon}</span>
                            <span>{dest.name}</span>
                            <span className={isSelected ? 'text-brand-100' : 'text-brand-600'}>
                              · {dest.distKm}km
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Expandable Full GPS Destination List */}
                    {showDestinationSuggestions && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl max-h-56 overflow-y-auto space-y-1 mt-2">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 py-1">
                          Calculated From Current GPS Position
                        </div>
                        {destinationSuggestions.map((dest) => (
                          <button
                            key={dest.name}
                            type="button"
                            onClick={() => {
                              setDestination([dest.lat, dest.lng]);
                              setDestinationAddress(dest.name);
                              setShowDestinationSuggestions(false);
                            }}
                            className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              destinationAddress === dest.name
                                ? 'bg-brand-50 border border-brand-200 text-brand-900 font-extrabold'
                                : 'hover:bg-white text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{dest.icon}</span>
                              <div>
                                <p className="font-extrabold">{dest.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{dest.address}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-black text-brand-600">₦{dest.fare.toLocaleString()}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{dest.distKm} km · ~{dest.eta}m</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dynamic Fare & Distance Estimate Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Estimated Fare</span>
                      <span className="text-lg font-black text-brand-600">
                        ₦{currentFare.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Approx. {currentDistanceKm} km · ~{currentEtaMins} mins</span>
                      <span className="font-bold text-slate-700">Okada Motorbike</span>
                    </div>
                  </div>

                  {/* Request Okada Button */}
                  <Button
                    variant="primary"
                    className="w-full py-4 text-base font-black shadow-lg"
                    onClick={handleRequestRide}
                    disabled={isCreating}
                  >
                    {isCreating ? 'Dispatching Okada…' : `Request Okada (₦${currentFare.toLocaleString()})`}
                  </Button>
                </div>
              )}
            </div>

            {/* Navigation Tabs Bar — DOCKED AT THE BOTTOM OF BOOK RIDE */}
            {renderNavBar()}
          </aside>

          {/* RIGHT SIDE: LIVE GOOGLE MAP (Top on Mobile, Right on Desktop Full Height) */}
          <main className={`order-1 md:order-2 flex-1 ${isBookingExpanded ? 'h-[50dvh]' : 'h-full'} md:h-full relative bg-slate-100 transition-all duration-300`}>
            <MapView
              center={effectivePickup}
              zoom={18}
              markers={mapMarkers}
              route={mapRoute}
              onPick={handleMapClick}
              onLocateMe={requestOnce}
              isReconnecting={isReconnecting}
              heading={heading}
              className="w-full h-full"
            />

            {/* Live Status Overlay Card */}
            <div className="absolute top-4 right-4 z-10 max-w-xs">
              {!isRideActive ? (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 shadow-lg text-xs flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div>
                    <p className="font-extrabold text-slate-900">
                      {nearbyRiders.length > 0 ? `${nearbyRiders.length} Online Okadas Nearby` : 'Searching for nearby okadas…'}
                    </p>
                    <p className="text-[10px] text-slate-500">Live positions updated every 3s</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white/95 backdrop-blur-md text-slate-900 rounded-2xl p-3 shadow-xl text-xs flex items-center gap-3 border border-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping shrink-0" />
                  <div>
                    <p className="font-extrabold text-slate-900">
                      {ride?.status === 'accepted'
                        ? `🛵 ${riderDetails?.name || 'Okada Rider'} is En Route`
                        : ride?.status === 'arriving'
                        ? '🛵 Rider Has Arrived at Pickup!'
                        : ride?.status === 'in_progress'
                        ? 'Trip in Progress'
                        : 'Dispatching Rider'}
                    </p>
                    {tracking?.distanceKm != null && (
                      <p className="text-[11px] text-brand-600 font-bold">
                        {tracking.distanceKm} km away {tracking?.etaMinutes != null ? `· ETA ~${tracking.etaMinutes} min` : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      ) : (
        /* 2. History, Wallet, and Settings have their OWN DEDICATED FULL PAGE (No map) */
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          <div className="flex-1 overflow-y-auto w-full">
            <div className="w-full py-4 sm:py-6">
              {activeTab === 'history' && <HistoryTab />}
              {activeTab === 'wallet' && <WalletTab />}
              {activeTab === 'settings' && (
                <SettingsTab onLogout={logout} onProfileUpdated={updateUser} />
              )}
            </div>
          </div>

          {/* Full-width docked Navigation bar */}
          {renderNavBar()}
        </div>
      )}
    </div>
  );
}
