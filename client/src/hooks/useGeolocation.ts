import { useCallback, useEffect, useRef, useState } from 'react';

type GeolocationOptions = {
  enabled?: boolean;
  maxAgeMs?: number;
};

/**
 * Track the browser's GPS position.
 */
export function useGeolocation({ enabled = true, maxAgeMs = 60_000 }: GeolocationOptions = {}) {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastFixRef = useRef(0);

  const handlePosition = useCallback(
    (pos: GeolocationPosition) => {
      if (pos.timestamp < lastFixRef.current && Date.now() - pos.timestamp > maxAgeMs) {
        return; // stale cached fix
      }
      lastFixRef.current = pos.timestamp;
      setPosition(pos);
      setError(null);
    },
    [maxAgeMs],
  );

  const handleError = useCallback((err: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      1: 'Location permission denied. Enable it in your browser settings to use Okada Connect.',
      2: 'Location unavailable. Try moving outdoors near a window.',
      3: 'Location request timed out. Try again.',
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
      timeout: 10_000,
    });
  }, [handlePosition, handleError]);

  useEffect(() => {
    if (!enabled) return undefined;

    if (!('geolocation' in navigator)) {
      setError('Your browser does not support location sharing.');
      return undefined;
    }

    requestOnce(); // get a first fix quickly (may be cached/low accuracy)
    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 15_000,
      timeout: 20_000,
    });

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    };
  }, [enabled, handlePosition, handleError, requestOnce]);

  return { position, error, requestOnce };
}
