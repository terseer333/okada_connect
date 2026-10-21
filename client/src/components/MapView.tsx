import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type MarkerKind = 'customer' | 'rider' | 'pickup' | 'default';

export type MapMarker = {
  id: string;
  position: [number, number];
  label?: string;
  kind?: MarkerKind;
};

type MapViewProps = {
  center: [number, number];
  markers?: MapMarker[];
  onPick?: (position: [number, number]) => void;
};

/**
 * Imperative Leaflet map wrapper.
 */
export default function MapView({ center, markers = [], onPick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return undefined;
    const map = L.map(containerRef.current, {
      attributionControl: false,
      zoomControl: true,
    }).setView(center, 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    if (onPick) map.on('click', (e: L.LeafletMouseEvent) => onPick([e.latlng.lat, e.latlng.lng]));
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
      const icon = MARKER_ICONS[spec.kind ?? 'default'];
      const marker = L.marker(spec.position, { icon, title: spec.label }).addTo(map);
      if (spec.label) marker.bindPopup(spec.label);
      markerRefs.current[id] = marker;
    }
  }, [markers]);

  return <div ref={containerRef} className="h-full w-full" />;
}

const pin = (emoji: string) =>
  L.divIcon({
    className: '',
    html: `<div style="font-size:26px; line-height:26px; filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));">${emoji}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });

const MARKER_ICONS: Record<MarkerKind, L.DivIcon> = {
  customer: pin('📍'),
  rider: pin('🏍️'),
  pickup: pin('🎯'),
  default: pin('📌'),
};
