"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Map, CheckCircle, Pencil, Loader2, X } from "lucide-react";

// Load the Leaflet map only on the client — avoids Next.js SSR errors
const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-xl bg-surface-raised border border-border flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
    </div>
  ),
});

// Mumbai city center — used as the map's default fallback
const MUMBAI_CENTER: [number, number] = [19.076, 72.8777];

export interface LocationData {
  lat: number;
  lng: number;
  locationText: string;
}

interface LocationPickerProps {
  onLocationSelected: (data: LocationData | null) => void;
}

type Mode = "idle" | "gps" | "map";

export default function LocationPicker({ onLocationSelected }: LocationPickerProps) {
  const [confirmed, setConfirmed] = useState<LocationData | null>(null);
  const [mode, setMode] = useState<Mode>("idle");

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  // Map picker state
  const [mapCenter, setMapCenter] = useState<[number, number]>(MUMBAI_CENTER);
  const [pendingMarker, setPendingMarker] = useState<[number, number] | null>(null);
  const [pendingAddress, setPendingAddress] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");

  // Whether the map panel is open
  const [mapOpen, setMapOpen] = useState(false);

  // Keep a ref to cancel stale reverse geocode calls in the map picker
  const geocodeAbortRef = useRef<AbortController | null>(null);

  // --- Helpers ---

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lng}`);
    if (!res.ok) throw new Error("Failed to reverse geocode");
    const data = await res.json();
    return data.address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }, []);

  const confirmLocation = useCallback(
    (lat: number, lng: number, locationText: string) => {
      const data: LocationData = { lat, lng, locationText };
      setConfirmed(data);
      onLocationSelected(data);
      setMode("idle");
      setMapOpen(false);
    },
    [onLocationSelected]
  );

  const resetLocation = useCallback(() => {
    setConfirmed(null);
    onLocationSelected(null);
    setPendingMarker(null);
    setPendingAddress("");
    setGpsError("");
    setGeocodeError("");
    setMode("idle");
    setMapOpen(false);
  }, [onLocationSelected]);

  // --- GPS Flow ---

  const handleGPS = useCallback(async () => {
    setMode("gps");
    setGpsLoading(true);
    setGpsError("");

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const text = await reverseGeocode(lat, lng);
          confirmLocation(lat, lng, text);
        } catch {
          // fall back to coords if reverse geocode fails
          confirmLocation(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        let msg = "Couldn't get your location — please try the map picker instead.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied — please use the map picker instead.";
        }
        setGpsError(msg);
        setGpsLoading(false);
        setMode("idle");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [reverseGeocode, confirmLocation]);

  // --- Map Picker Flow ---

  const openMapPicker = useCallback(() => {
    setMode("map");
    setMapOpen(true);
    setGeocodeError("");
    // If GPS previously gave us coords, center there
    if (confirmed) {
      setMapCenter([confirmed.lat, confirmed.lng]);
      setPendingMarker([confirmed.lat, confirmed.lng]);
      setPendingAddress(confirmed.locationText);
    }
  }, [confirmed]);

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      setPendingMarker([lat, lng]);
      setPendingAddress("");
      setGeocodeError("");
      setGeocoding(true);

      // Cancel any in-flight geocode call
      geocodeAbortRef.current?.abort();
      const controller = new AbortController();
      geocodeAbortRef.current = controller;

      try {
        const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lng}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Geocode failed");
        const data = await res.json();
        setPendingAddress(data.address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return; // stale call, ignore
        setGeocodeError("Couldn't resolve address — you can still confirm with coordinates.");
        setPendingAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } finally {
        setGeocoding(false);
      }
    },
    []
  );

  const handleConfirmMap = useCallback(() => {
    if (!pendingMarker || !pendingAddress) return;
    confirmLocation(pendingMarker[0], pendingMarker[1], pendingAddress);
  }, [pendingMarker, pendingAddress, confirmLocation]);

  // Cleanup geocode abort controller on unmount
  useEffect(() => {
    return () => geocodeAbortRef.current?.abort();
  }, []);

  // --- Render: Confirmed state ---
  if (confirmed) {
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-start gap-2.5 min-w-0">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-800">Location confirmed</p>
              <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed break-words">{confirmed.locationText}</p>
              <p className="text-[11px] text-emerald-600 font-mono mt-1">
                {confirmed.lat.toFixed(5)}, {confirmed.lng.toFixed(5)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetLocation}
            className="shrink-0 flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-medium transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        </div>

        {/* Static map thumbnail */}
        <div className="relative z-0 isolate h-40 rounded-xl overflow-hidden border border-border pointer-events-none" style={{ isolation: "isolate", zIndex: 0 }}>
          <LocationPickerMap
            center={[confirmed.lat, confirmed.lng]}
            marker={[confirmed.lat, confirmed.lng]}
            onMapClick={() => {}}
            readOnly
            zoom={15}
            className="h-full"
          />
        </div>
      </div>
    );
  }

  // --- Render: Map picker open ---
  if (mapOpen) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text-primary">Click anywhere on the map to drop a pin</p>
          <button
            type="button"
            onClick={() => { setMapOpen(false); setMode("idle"); }}
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close map picker"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-0 isolate h-72 rounded-xl overflow-hidden border border-border" style={{ isolation: "isolate", zIndex: 0 }}>
          <LocationPickerMap
            center={mapCenter}
            marker={pendingMarker}
            onMapClick={handleMapClick}
            zoom={13}
            className="h-full"
          />
        </div>

        {/* Address preview / geocoding status */}
        <div className="min-h-[2.5rem]">
          {geocoding && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Resolving address…
            </div>
          )}
          {!geocoding && pendingAddress && (
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-primary-500 mt-0.5 shrink-0" />
              <p className="text-xs text-text-secondary leading-relaxed">{pendingAddress}</p>
            </div>
          )}
          {!geocoding && geocodeError && (
            <p className="text-xs text-amber-600">{geocodeError}</p>
          )}
          {!pendingMarker && !geocoding && (
            <p className="text-xs text-text-muted">No pin dropped yet — tap the map above.</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleConfirmMap}
          disabled={!pendingMarker || !pendingAddress || geocoding}
          className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Confirm Location
        </button>
      </div>
    );
  }

  // --- Render: Idle (picker buttons + error) ---
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* GPS button */}
        <button
          type="button"
          onClick={handleGPS}
          disabled={gpsLoading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-semibold text-text-secondary hover:text-primary-600 hover:border-primary-400 hover:bg-primary-50/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {gpsLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
              Locating…
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 text-primary-500" />
              Use my current location
            </>
          )}
        </button>

        <span className="text-xs text-text-muted shrink-0">or</span>

        {/* Map picker button */}
        <button
          type="button"
          onClick={openMapPicker}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-semibold text-text-secondary hover:text-primary-600 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
        >
          <Map className="w-4 h-4 text-primary-500" />
          Pick on map
        </button>
      </div>

      {gpsError && (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
          {gpsError}
        </p>
      )}
    </div>
  );
}
