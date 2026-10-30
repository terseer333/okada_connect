import { useCallback, useEffect, useRef, useState } from 'react';

type GeolocationOptions = {
  enabled?: boolean;
};

const LAST_LAT_KEY = 'okada_last_gps_lat';
const LAST_LNG_KEY = 'okada_last_gps_lng';

function getCachedPosition(): GeolocationPosition | null {
  try {
    const latStr = localStorage.getItem(LAST_LAT_KEY);
    const lngStr = localStorage.getItem(LAST_LNG_KEY);
    if (latStr && lngStr) {
      const latitude = parseFloat(latStr);
      const longitude = parseFloat(lngStr);
      if (!isNaN(latitude) && !isNaN(longitude)) {
        return {
          coords: {
            latitude,
            longitude,
            accuracy: 25,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

/**
 * Real-time GPS movement tracker with live watchPosition,
 * compass heading orientation, and instant local cache restoration.
 */
export function useGeolocation({ enabled = true }: GeolocationOptions = {}) {
  const [position, setPosition] = useState<GeolocationPosition | null>(() => getCachedPosition());
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const hasHardwareFixRef = useRef<boolean>(false);

  const handlePosition = useCallback((pos: GeolocationPosition) => {
    hasHardwareFixRef.current = true;
    setPosition(pos);
    setError(null);
    try {
      localStorage.setItem(LAST_LAT_KEY, pos.coords.latitude.toString());
      localStorage.setItem(LAST_LNG_KEY, pos.coords.longitude.toString());
    } catch {
      // Ignore storage errors
    }
    if (pos.coords.heading !== null && !isNaN(pos.coords.heading)) {
      setHeading(Math.round(pos.coords.heading));
    }
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      1: 'Location permission denied. Enable location in browser settings to track live okada rides.',
      2: 'Searching for GPS fix…',
      3: 'GPS request timed out. Retrying GPS search…',
    };
    setError(messages[err.code] || 'Could not get your location.');
  }, []);

  const requestOnce = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Your browser does not support location sharing.');
      return;
    }
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10_000,
    });
  }, [handlePosition, handleError]);

  // Compass Heading & Device Orientation Listener
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // iOS webkitCompassHeading or Android alpha (360 - alpha)
      const anyEvent = e as unknown as { webkitCompassHeading?: number };
      let h: number | null = null;

      if (typeof anyEvent.webkitCompassHeading === 'number') {
        h = anyEvent.webkitCompassHeading;
      } else if (typeof e.alpha === 'number' && e.absolute) {
        h = (360 - e.alpha) % 360;
      } else if (typeof e.alpha === 'number') {
        h = (360 - e.alpha) % 360;
      }

      if (h !== null && !isNaN(h)) {
        setHeading(Math.round(h));
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    window.addEventListener('deviceorientation', handleOrientation as EventListener, true);

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    if (!('geolocation' in navigator)) {
      setError('Your browser does not support location sharing.');
      return undefined;
    }

    // Immediately trigger high-accuracy GPS fix
    requestOnce();

    // Stream live GPS coordinates continuously as user moves
    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 12_000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
    };
  }, [enabled, handlePosition, handleError, requestOnce]);

  return { position, heading, error, requestOnce };
}
