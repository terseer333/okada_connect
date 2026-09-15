import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Imperative Leaflet map wrapper.
 *
 * @param {object} props
 * @param {[number, number]} props.center - [lat, lon] to keep in view
 * @param {Array} props.markers - [{ id, position: [lat, lon], label, kind }]
 * @param {Function} [props.onPick] - called with [lat, lon] when the user taps the map
 */
export default function MapView({ center, markers = [], onPick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRefs = useRef({}); // id -> L.Marker

  // Create the map once.
  useEffect(() => {
    const map = L.map(containerRef.current, {
      attributionControl: false,
      zoomControl: true,
    }).setView(center, 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    if (onPick) map.on('click', (e) => onPick([e.latlng.lat, e.latlng.lng]));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRefs.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the view on the latest center.
  useEffect(() => {
    if (mapRef.current && center) mapRef.current.setView(center, mapRef.current.getZoom());
  }, [center?.[0], center?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync markers by id.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const wanted = new Map(markers.map((m) => [m.id, m]));

    for (const [id, layer] of Object.entries(markerRefs.current)) {
      if (!wanted.has(id)) {
        map.removeLayer(layer);
        delete markerRefs.current[id];
      }
    }
    for (const [id, spec] of wanted) {
      if (markerRefs.current[id]) {
        markerRefs.current[id].setLatLng(spec.position);
        continue;
      }
      const icon = MARKER_ICONS[spec.kind] || MARKER_ICONS.default;
      const marker = L.marker(spec.position, { icon, title: spec.label }).addTo(map);
      if (spec.label) marker.bindPopup(spec.label);
      markerRefs.current[id] = marker;
    }
  }, [markers]);

  return <div ref={containerRef} className="h-full w-full" />;
}

const pin = (emoji, bg) =>
  L.divIcon({
    className: '',
    html: `<div style="font-size:26px; line-height:26px; filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));">${emoji}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
    background: bg,
  });

const MARKER_ICONS = {
  customer: pin('📍', '#ef4444'),
  rider: pin('🏍️', '#22c55e'),
  pickup: pin('🎯', '#f59e0b'),
  default: pin('📌', '#6b7280'),
};
