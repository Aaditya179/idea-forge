"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default marker icon broken in Webpack/Next.js
// (the icon images are not bundled automatically)
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerMapProps {
  center: [number, number];
  marker: [number, number] | null;
  onMapClick: (lat: number, lng: number) => void;
  /** If true, the map is read-only (used for the confirmed preview thumbnail) */
  readOnly?: boolean;
  zoom?: number;
  className?: string;
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({
  center,
  marker,
  onMapClick,
  readOnly = false,
  zoom = 13,
  className = "",
}: LocationPickerMapProps) {
  // Leaflet attaches to window — ensure it only runs after mount
  useEffect(() => {
    // No-op: just ensures this module only runs client-side
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={!readOnly}
      dragging={!readOnly}
      zoomControl={!readOnly}
      doubleClickZoom={false}
      className={`w-full rounded-xl overflow-hidden relative z-0 isolate ${className}`}
      style={{ cursor: readOnly ? "default" : "crosshair", isolation: "isolate", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {!readOnly && <ClickHandler onMapClick={onMapClick} />}
      {marker && (
        <Marker position={marker} icon={markerIcon} />
      )}
    </MapContainer>
  );
}
