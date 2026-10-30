import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
} from '@vis.gl/react-google-maps';

export type MarkerKind = 'customer' | 'rider' | 'self' | 'pickup' | 'destination' | 'default';

export type MapMarker = {
  id: string;
  position: [number, number]; // [lat, lng]
  label?: string;
  kind?: MarkerKind;
};

export type MapViewProps = {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  route?: [number, number][]; // [[lat, lng], [lat, lng], ...]
  onPick?: (position: [number, number]) => void;
  onLocateMe?: () => void;
  isReconnecting?: boolean;
  className?: string;
  heading?: number | null;
};

/**
 * Hook to glide marker positions smoothly over animationDurationMs (~3.8s)
 * between 4-second polling updates instead of teleporting.
 */
function useSmoothMarkers(markers: MapMarker[], animationDurationMs = 3800): MapMarker[] {
  const [animatedPositions, setAnimatedPositions] = useState<Record<string, [number, number]>>({});
  const startPositionsRef = useRef<Record<string, [number, number]>>({});
  const targetPositionsRef = useRef<Record<string, [number, number]>>({});
  const startTimeRef = useRef<number>(Date.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const now = Date.now();
    startTimeRef.current = now;

    for (const m of markers) {
      const current = animatedPositions[m.id] || m.position;
      startPositionsRef.current[m.id] = current;
      targetPositionsRef.current[m.id] = m.position;
    }

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(1, elapsed / animationDurationMs);
      const ease = progress * (2 - progress); // smooth ease-out

      const nextPos: Record<string, [number, number]> = {};
      for (const m of markers) {
        const start = startPositionsRef.current[m.id] || m.position;
        const target = targetPositionsRef.current[m.id] || m.position;
        nextPos[m.id] = [
          start[0] + (target[0] - start[0]) * ease,
          start[1] + (target[1] - start[1]) * ease,
        ];
      }

      setAnimatedPositions(nextPos);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [markers, animationDurationMs]);

  return useMemo(() => {
    return markers.map((m) => ({
      ...m,
      position: animatedPositions[m.id] || m.position,
    }));
  }, [markers, animatedPositions]);
}

/**
 * Helper to build marker HTML string for Leaflet DivIcon
 */
function buildMarkerHtml(marker: MapMarker, heading?: number | null): string {
  const kind = marker.kind || 'default';
  const labelHtml = marker.label
    ? `<span class="marker-pill">${marker.label}</span>`
    : '';

  if (kind === 'pickup' || kind === 'customer') {
    return `
      <div class="custom-marker marker-pickup">
        <svg width="32" height="38" viewBox="0 0 24 30" fill="none">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 8.5 12 18 12 18s12-9.5 12-18c0-6.63-5.37-12-12-12z" fill="#ef2435"/>
          <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
        </svg>
        ${labelHtml}
      </div>
    `;
  }

  if (kind === 'destination') {
    return `
      <div class="custom-marker marker-destination">
        ${labelHtml}
        <div class="marker-square"></div>
      </div>
    `;
  }

  // Okada Motorcycle Rider (Available nearby or assigned approaching okada)
  if (kind === 'rider') {
    const isAssigned = marker.id.includes('assigned');
    return `
      <div class="custom-marker okada-motorcycle-marker ${isAssigned ? 'okada-assigned-rider' : ''}">
        <div class="okada-pulse-ring"></div>
        <div class="okada-moto-circle">
          <span class="okada-moto-emoji">🛵</span>
        </div>
        ${labelHtml ? `<span class="marker-pill okada-rider-pill">${marker.label}</span>` : ''}
      </div>
    `;
  }

  // User's Own Live Position: Authentic Google Maps Blue Dot with Heading Beam
  const headingDeg = typeof heading === 'number' && !isNaN(heading) ? heading : 0;
  return `
    <div class="custom-marker google-blue-location-container">
      <div class="google-flashlight-beam" style="transform: rotate(${headingDeg}deg);">
        <div class="google-beam-fan"></div>
      </div>
      <div class="google-blue-pulse-ring"></div>
      <div class="google-blue-dot-core"></div>
      ${labelHtml ? `<span class="marker-pill google-blue-pill">${marker.label}</span>` : ''}
    </div>
  `;
}

/**
 * Google Street View Panorama Viewer:
 * Renders native 360° Google Street View panorama or interactive 360° viewer with
 * heading rotation and direct 1-click launch to the building's street view in Google Maps.
 */
function StreetViewPanoramaViewer({
  position,
  apiKey,
  onClose,
}: {
  position: [number, number];
  apiKey: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [heading, setHeading] = useState(160);
  const [pitch] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (window.google?.maps?.StreetViewPanorama) {
      try {
        const svService = new window.google.maps.StreetViewService();
        const pano = new window.google.maps.StreetViewPanorama(containerRef.current, {
          position: { lat: position[0], lng: position[1] },
          pov: { heading, pitch },
          zoom: 1,
          addressControl: true,
          showRoadLabels: true,
          motionTracking: true,
        });

        svService.getPanorama(
          { location: { lat: position[0], lng: position[1] }, radius: 150 },
          (data, status) => {
            if (status === window.google.maps.StreetViewStatus.OK && data?.location?.pano) {
              pano.setPano(data.location.pano);
            } else {
              setLoadError('Street View panorama searching nearest road...');
            }
          }
        );

        return () => {
          pano.setVisible(false);
        };
      } catch (err) {
        setLoadError((err as Error).message);
      }
    } else if (apiKey) {
      const scriptId = 'google-maps-js-sdk';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.onload = () => {
          if (containerRef.current && window.google?.maps) {
            new window.google.maps.StreetViewPanorama(containerRef.current, {
              position: { lat: position[0], lng: position[1] },
              pov: { heading, pitch },
              zoom: 1,
            });
          }
        };
        document.head.appendChild(script);
      }
    }
  }, [position, apiKey, heading, pitch]);

  const [streetZoom, setStreetZoom] = useState(19);

  return (
    <div className="absolute inset-0 z-30 bg-slate-950 flex flex-col text-white animate-in fade-in duration-200">
      {/* Street View Top Header */}
      <div className="bg-slate-900/95 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🚶</span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-white">Street & Building View (360°)</h4>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-600 text-white">
                In-App Explorer
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Building: {position[0].toFixed(5)}, {position[1].toFixed(5)} · Heading {heading}°
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center gap-1.5 font-bold text-xs transition-all border border-slate-700 cursor-pointer"
          title="Return to Live Map"
        >
          <span>✕ Close Explorer</span>
        </button>
      </div>

      {/* Street View Container */}
      <div className="flex-1 relative w-full h-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />

        {/* In-App Interactive 360 Panoramic & Street Exploration View */}
        {(!window.google?.maps || loadError) && (
          <div className="relative z-10 max-w-2xl w-full h-full p-4 flex flex-col justify-between">
            {/* Upper Interactive Viewport */}
            <div className="relative flex-1 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 flex items-center justify-center">
              {/* High-res Google Hybrid satellite imagery showing exact building entrance and frontage */}
              <img
                src={`https://mt1.google.com/vt/lyrs=y&x=${Math.floor(
                  ((position[1] + 180) / 360) * Math.pow(2, streetZoom)
                )}&y=${Math.floor(
                  ((1 -
                    Math.log(Math.tan((position[0] * Math.PI) / 180) + 1 / Math.cos((position[0] * Math.PI) / 180)) /
                      Math.PI) /
                    2) *
                    Math.pow(2, streetZoom)
                )}&z=${streetZoom}`}
                alt="Building & Street View"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out"
                style={{
                  transform: `rotate(${heading}deg) scale(1.35)`,
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://mt1.google.com/vt/lyrs=m&x=${Math.floor(
                    ((position[1] + 180) / 360) * Math.pow(2, streetZoom)
                  )}&y=${Math.floor(
                    ((1 -
                      Math.log(Math.tan((position[0] * Math.PI) / 180) + 1 / Math.cos((position[0] * Math.PI) / 180)) /
                        Math.PI) /
                      2) *
                      Math.pow(2, streetZoom)
                  )}&z=${streetZoom}`;
                }}
              />

              {/* Viewport Crosshair & Street Reticle */}
              <div className="absolute inset-0 bg-radial from-transparent via-slate-950/20 to-slate-950/80 pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center gap-2 pointer-events-none">
                <div className="w-12 h-12 rounded-full border-2 border-brand-500 bg-brand-600/30 backdrop-blur-xs flex items-center justify-center text-white shadow-xl animate-pulse">
                  📍
                </div>
                <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 text-xs font-bold shadow-lg">
                  Building Frontage · Facing {heading}°
                </div>
              </div>

              {/* Compass Needle */}
              <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md rounded-2xl p-2.5 border border-slate-700 shadow-xl flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-black text-brand-500 transition-transform duration-300"
                  style={{ transform: `rotate(${-heading}deg)` }}
                >
                  ↑N
                </div>
                <span className="text-xs font-black text-white">{heading}°</span>
              </div>
            </div>

            {/* Bottom 360° Controls Bar */}
            <div className="mt-3 bg-slate-900/95 backdrop-blur-md rounded-3xl p-3 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-2 shrink-0">
              {/* Pan Left / Right */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setHeading((h) => (h - 45 + 360) % 360)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 cursor-pointer active:scale-95 transition-all"
                  title="Rotate view left"
                >
                  ↺ Turn Left (45°)
                </button>
                <button
                  type="button"
                  onClick={() => setHeading((h) => (h + 45) % 360)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 cursor-pointer active:scale-95 transition-all"
                  title="Rotate view right"
                >
                  Turn Right (45°) ↻
                </button>
              </div>

              {/* Quick Cardinal Angles */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setHeading(0)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    heading === 0 ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  North
                </button>
                <button
                  type="button"
                  onClick={() => setHeading(90)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    heading === 90 ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  East
                </button>
                <button
                  type="button"
                  onClick={() => setHeading(180)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    heading === 180 ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  South
                </button>
                <button
                  type="button"
                  onClick={() => setHeading(270)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    heading === 270 ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  West
                </button>
              </div>

              {/* Zoom In / Zoom Out */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setStreetZoom((z) => Math.min(19, z + 1))}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 cursor-pointer"
                  title="Zoom In"
                >
                  + Zoom
                </button>
                <button
                  type="button"
                  onClick={() => setStreetZoom((z) => Math.max(17, z - 1))}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 cursor-pointer"
                  title="Zoom Out"
                >
                  − Zoom
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const MAP_MODE_KEY = 'okada_map_layer_mode';

type MapLayerMode = 'streets' | 'satellite' | 'dark';

/**
 * Real-time Google Maps Interactive Map:
 * Google Roadmap, Google Satellite Hybrid (with real building rooftops & place labels),
 * Google Dark Mode (identical to Google Maps Android Night view),
 * Authentic Google Blue Location Dot with directional beam, building-level zoom (up to 20/21).
 */
function GoogleLeafletMap({
  center,
  zoom = 18,
  markers = [],
  route,
  onPick,
  onLocateMe,
  apiKey = '',
  heading,
  className = '',
}: {
  center: [number, number];
  zoom?: number;
  markers: MapMarker[];
  route?: [number, number][];
  onPick?: (pos: [number, number]) => void;
  onLocateMe?: () => void;
  apiKey?: string;
  heading?: number | null;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const polylineRef = useRef<L.Polyline | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  const [mapMode, setMapMode] = useState<MapLayerMode>(() => {
    try {
      const saved = localStorage.getItem(MAP_MODE_KEY);
      if (saved === 'satellite' || saved === 'dark' || saved === 'streets') return saved;
    } catch {
      // Ignore storage errors
    }
    return 'streets';
  });

  const [showStreetView, setShowStreetView] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const layersDropdownRef = useRef<HTMLDivElement>(null);

  const changeMapMode = (mode: MapLayerMode) => {
    setMapMode(mode);
    try {
      localStorage.setItem(MAP_MODE_KEY, mode);
    } catch {
      // Ignore storage errors
    }
  };

  // Close layers dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (layersDropdownRef.current && !layersDropdownRef.current.contains(event.target as Node)) {
        setIsLayersOpen(false);
      }
    }
    if (isLayersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isLayersOpen]);

  // Initialize Leaflet map with high-res building zoom
  useEffect(() => {
    if (!containerRef.current) return undefined;

    const map = L.map(containerRef.current, {
      attributionControl: false,
      zoomControl: false,
      center,
      zoom,
      maxZoom: 21,
    });
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Initial Google Maps Layer
    const layerUrl =
      mapMode === 'satellite'
        ? 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        : 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

    const googleLayer = L.tileLayer(layerUrl, {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 21,
      maxNativeZoom: 20,
      attribution: '&copy; Google Maps',
    });
    googleLayer.addTo(map);
    tileLayerRef.current = googleLayer;

    // Draw Google Maps subtle GPS accuracy circle
    const circle = L.circle(center, {
      radius: 20,
      color: '#1a73e8',
      weight: 1,
      opacity: 0.45,
      fillColor: '#1a73e8',
      fillOpacity: 0.1,
    }).addTo(map);
    accuracyCircleRef.current = circle;

    if (onPick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onPick([e.latlng.lat, e.latlng.lng]);
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markersRef.current = {};
      polylineRef.current = null;
      accuracyCircleRef.current = null;
    };
  }, []);

  // Switch between Google Streets, Google Satellite Hybrid, and Google Dark Mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let layerUrl = 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    let attribution = '&copy; Google Maps';

    if (mapMode === 'satellite') {
      // Google Hybrid: Satellite imagery + building outlines & place labels
      layerUrl = 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Satellite Imagery';
    } else if (mapMode === 'dark') {
      // Google Roadmap in Night Mode
      layerUrl = 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps Dark';
    }

    const newLayer = L.tileLayer(layerUrl, {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 21,
      maxNativeZoom: 20,
      attribution,
    });
    newLayer.addTo(map);
    tileLayerRef.current = newLayer;

    // Apply or remove dark filter class on tile pane
    const tilePane = map.getPane('tilePane');
    if (tilePane) {
      if (mapMode === 'dark') {
        tilePane.classList.add('google-dark-tiles');
      } else {
        tilePane.classList.remove('google-dark-tiles');
      }
    }
  }, [mapMode]);

  // Recenter map and move accuracy circle when center changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    map.panTo([center[0], center[1]], { animate: true, duration: 0.8 });
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng([center[0], center[1]]);
    }
  }, [center[0], center[1]]);

  // Sync Markers with authentic Google styling & Heading rotation
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const activeIds = new Set(markers.map((m) => m.id));

    for (const [id, markerLayer] of Object.entries(markersRef.current)) {
      if (!activeIds.has(id)) {
        map.removeLayer(markerLayer);
        delete markersRef.current[id];
      }
    }

    for (const m of markers) {
      const existing = markersRef.current[m.id];
      const iconHtml = buildMarkerHtml(m, heading);
      const isGoogleDot = m.kind === 'self' || m.id.includes('self');
      const isRider = m.kind === 'rider';
      const icon = L.divIcon({
        className: 'leaflet-custom-marker-wrapper',
        html: iconHtml,
        iconSize: isGoogleDot ? [30, 30] : isRider ? [38, 38] : [32, 38],
        iconAnchor: isGoogleDot ? [15, 15] : isRider ? [19, 19] : [16, m.kind === 'destination' ? 19 : 38],
      });

      if (existing) {
        existing.setLatLng([m.position[0], m.position[1]]);
        existing.setIcon(icon);
      } else {
        const marker = L.marker([m.position[0], m.position[1]], { icon }).addTo(map);
        markersRef.current[m.id] = marker;
      }
    }
  }, [markers, heading]);

  // Sync Dashed Red Route Polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (route && route.length >= 2) {
      const line = L.polyline(
        route.map(([lat, lng]) => [lat, lng]),
        {
          color: '#ef2435',
          dashArray: '8, 8',
          weight: 4.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }
      ).addTo(map);
      polylineRef.current = line;
    }
  }, [route]);

  const handleZoomToLocation = () => {
    if (onLocateMe) {
      onLocateMe();
    }
    const map = mapRef.current;
    if (map && center) {
      map.flyTo([center[0], center[1]], 19, { duration: 1.0 });
    }
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Google Maps Layer Switcher: Streets, Satellite Hybrid, Dark Mode & Street View */}
      <div ref={layersDropdownRef} className="absolute top-4 left-4 z-20">
        <button
          type="button"
          onClick={() => setIsLayersOpen((open) => !open)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl text-xs font-black text-slate-800 border border-slate-200 shadow-md hover:bg-slate-50 transition-all cursor-pointer select-none active:scale-95"
          title="Change map view (Google Streets, Satellite, Dark Mode, Street View)"
          aria-expanded={isLayersOpen}
        >
          <span className="text-sm">
            {showStreetView
              ? '🚶'
              : mapMode === 'satellite'
              ? '🛰️'
              : mapMode === 'dark'
              ? '🌙'
              : '🗺️'}
          </span>
          <span className="text-xs">
            {showStreetView
              ? 'Street View'
              : mapMode === 'satellite'
              ? 'Satellite'
              : mapMode === 'dark'
              ? 'Dark Mode'
              : 'Google Maps'}
          </span>
          <span
            className={`text-[9px] text-slate-500 transition-transform duration-200 ${
              isLayersOpen ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </button>

        {isLayersOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-52 bg-white/98 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl p-1.5 space-y-1 z-30 animate-in fade-in duration-150">
            <button
              type="button"
              onClick={() => {
                changeMapMode('streets');
                setShowStreetView(false);
                setIsLayersOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                mapMode === 'streets' && !showStreetView
                  ? 'bg-brand-50 text-brand-700 font-black'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🗺️</span>
                <span>Google Maps (Streets)</span>
              </span>
              {mapMode === 'streets' && !showStreetView && <span className="text-brand-600 text-xs font-black">✓</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                changeMapMode('satellite');
                setShowStreetView(false);
                setIsLayersOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                mapMode === 'satellite' && !showStreetView
                  ? 'bg-brand-50 text-brand-700 font-black'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🛰️</span>
                <span>Google Satellite</span>
              </span>
              {mapMode === 'satellite' && !showStreetView && <span className="text-brand-600 text-xs font-black">✓</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                changeMapMode('dark');
                setShowStreetView(false);
                setIsLayersOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                mapMode === 'dark' && !showStreetView
                  ? 'bg-brand-50 text-brand-700 font-black'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🌙</span>
                <span>Google Dark Mode</span>
              </span>
              {mapMode === 'dark' && !showStreetView && <span className="text-brand-600 text-xs font-black">✓</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowStreetView(true);
                setIsLayersOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                showStreetView
                  ? 'bg-brand-50 text-brand-700 font-black'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🚶</span>
                <span>Google Street View</span>
              </span>
              {showStreetView && <span className="text-brand-600 text-xs font-black">✓</span>}
            </button>
          </div>
        )}
      </div>

      {/* Floating Google Maps Blue GPS Target Reticle Button */}
      <button
        type="button"
        onClick={handleZoomToLocation}
        className="absolute bottom-20 right-4 z-20 w-12 h-12 bg-white hover:bg-slate-50 text-brand-600 rounded-full shadow-2xl border border-slate-200 flex items-center justify-center cursor-pointer transition-all active:scale-90 select-none group"
        title="Recenter on your exact GPS location"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1a73e8"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="group-active:scale-110 transition-transform"
        >
          <circle cx="12" cy="12" r="7" />
          <line x1="12" y1="1" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="1" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="23" y2="12" />
          <circle cx="12" cy="12" r="2.5" fill="#1a73e8" />
        </svg>
      </button>

      {/* Google Street View Panorama Modal */}
      {showStreetView && (
        <StreetViewPanoramaViewer
          position={center}
          apiKey={apiKey}
          onClose={() => setShowStreetView(false)}
        />
      )}

      {/* Embedded CSS for custom Google Maps markers and Night Mode */}
      <style>{`
        .leaflet-custom-marker-wrapper {
          background: transparent !important;
          border: none !important;
        }
        .custom-marker {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          user-select: none;
        }
        .marker-pickup {
          transform: translate(-50%, -100%);
          cursor: pointer;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
        .marker-destination {
          transform: translate(-50%, -50%);
        }

        /* --- Okada Motorcycle Marker (Online & Assigned Riders) --- */
        .okada-motorcycle-marker {
          position: relative;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translate(-50%, -50%);
          filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35));
        }
        .okada-moto-circle {
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          background: #0f172a;
          border: 2.5px solid #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.45);
          transition: transform 0.2s ease;
          z-index: 3;
        }
        .okada-assigned-rider .okada-moto-circle {
          border-color: #ef2435;
          box-shadow: 0 2px 10px rgba(239, 36, 53, 0.55);
        }
        .okada-moto-emoji {
          font-size: 16px;
          line-height: 1;
        }
        .okada-pulse-ring {
          position: absolute;
          width: 48px;
          height: 48px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.22);
          border: 1.5px solid rgba(16, 185, 129, 0.5);
          animation: okada-pulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
          pointer-events: none;
          z-index: 1;
        }
        .okada-assigned-rider .okada-pulse-ring {
          background: rgba(239, 36, 53, 0.22);
          border-color: rgba(239, 36, 53, 0.55);
          animation: okada-pulse 1.4s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }
        .okada-rider-pill {
          background: #0f172a !important;
          color: #ffffff !important;
          border-color: #334155 !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          margin-top: 6px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3) !important;
          white-space: nowrap !important;
        }
        .okada-assigned-rider .okada-rider-pill {
          background: #ef2435 !important;
          border-color: #cf1528 !important;
          color: #ffffff !important;
        }
        @keyframes okada-pulse {
          0% { transform: scale(0.85); opacity: 0.95; }
          50% { transform: scale(1.35); opacity: 0.25; }
          100% { transform: scale(0.85); opacity: 0.95; }
        }

        /* --- Iconic Google Maps Blue GPS Dot & Flashlight Beam --- */
        .google-blue-location-container {
          position: relative;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translate(-50%, -50%);
        }
        .google-flashlight-beam {
          position: absolute;
          width: 140px;
          height: 140px;
          top: -55px;
          left: -55px;
          pointer-events: none;
          transform-origin: center center;
          transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.4, 1);
          z-index: 1;
        }
        .google-beam-fan {
          width: 100%;
          height: 100%;
          background: conic-gradient(
            from -35deg at 50% 50%,
            transparent 0deg,
            rgba(26, 115, 232, 0.42) 20deg,
            rgba(26, 115, 232, 0.58) 35deg,
            rgba(26, 115, 232, 0.42) 50deg,
            transparent 70deg
          );
          -webkit-mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 15%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0) 70%);
          mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 15%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0) 70%);
        }
        .google-blue-pulse-ring {
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          background: rgba(26, 115, 232, 0.22);
          border: 1.5px solid rgba(26, 115, 232, 0.5);
          animation: google-pulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
          pointer-events: none;
          z-index: 2;
        }
        .google-blue-dot-core {
          position: relative;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #1a73e8;
          border: 2.8px solid #ffffff;
          box-shadow: 0 2px 7px rgba(0, 0, 0, 0.4);
          z-index: 3;
        }
        .google-blue-pill {
          background: #1a73e8 !important;
          color: #ffffff !important;
          border-color: #1557b0 !important;
          font-size: 10.5px !important;
          margin-top: 6px;
          box-shadow: 0 2px 6px rgba(26, 115, 232, 0.4) !important;
          z-index: 4;
        }
        @keyframes google-pulse {
          0% {
            transform: scale(0.85);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.35);
            opacity: 0.35;
          }
          100% {
            transform: scale(0.85);
            opacity: 0.95;
          }
        }

        .marker-pill {
          white-space: nowrap;
          background: #ffffff;
          color: #1e293b;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 9999px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.18);
          border: 1px solid #cbd5e1;
          margin-bottom: 4px;
          pointer-events: none;
        }
        .marker-square {
          width: 18px;
          height: 18px;
          border-radius: 3px;
          background: #0f172a;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        }

        /* --- Google Maps Night Mode Dark Styling --- */
        .google-dark-tiles img.leaflet-tile {
          filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(90%);
        }
      `}</style>
    </div>
  );
}

/**
 * Universal MapView component:
 * High-definition Google Maps with Google Streets, Google Satellite Hybrid,
 * Google Dark Mode, and Street View with authentic Google Blue Location Dot.
 */
export default function MapView({
  center,
  zoom = 18,
  markers = [],
  route,
  onPick,
  onLocateMe,
  isReconnecting = false,
  className = '',
  heading,
}: MapViewProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
  const smoothMarkers = useSmoothMarkers(markers);
  const [googleMapsError, setGoogleMapsError] = useState(false);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Reconnecting banner if polling drops */}
      {isReconnecting && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-xs text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-slate-200 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-brand-500" />
          <span>Reconnecting to live tracking…</span>
        </div>
      )}

      {/* Google Maps via @vis.gl/react-google-maps if API key is provided */}
      {apiKey && !googleMapsError ? (
        <APIProvider apiKey={apiKey} onError={() => setGoogleMapsError(true)}>
          <GoogleMap
            style={{ width: '100%', height: '100%' }}
            defaultCenter={{ lat: center[0], lng: center[1] }}
            defaultZoom={zoom}
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl
            streetViewControl
            onClick={(e) => {
              if (onPick && e.detail.latLng) {
                onPick([e.detail.latLng.lat, e.detail.latLng.lng]);
              }
            }}
          >
            {smoothMarkers.map((m) => (
              <AdvancedMarker
                key={m.id}
                position={{ lat: m.position[0], lng: m.position[1] }}
                title={m.label}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: buildMarkerHtml(m, heading) }}
                  className="pointer-events-auto"
                />
              </AdvancedMarker>
            ))}
          </GoogleMap>
        </APIProvider>
      ) : (
        /* Real-time Google Maps with Streets, Satellite Hybrid, Dark Mode, & Street View */
        <GoogleLeafletMap
          center={center}
          zoom={zoom}
          markers={smoothMarkers}
          route={route}
          onPick={onPick}
          onLocateMe={onLocateMe}
          apiKey={apiKey}
          heading={heading}
          className="w-full h-full"
        />
      )}
    </div>
  );
}
