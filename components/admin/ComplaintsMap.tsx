"use client";

import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import type { ComplaintMapPoint } from "@/lib/queries/complaints";

const STATUS_COLORS: Record<string, string> = {
    submitted: "#3b82f6",
    in_review: "#f59e0b",
    assigned: "#8b5cf6",
    resolved: "#10b981",
    rejected: "#ef4444",
};

const PRIORITY_WEIGHT: Record<string, number> = {
    high: 1.0,
    medium: 0.6,
    low: 0.3,
};

/** Snapchat-style gradient: Blue → Green → Yellow → Orange → Red */
const HEATMAP_GRADIENT: Record<number, string> = {
    0.2: "#0033ff",
    0.4: "#00ff66",
    0.6: "#ffff00",
    0.8: "#ff9900",
    1.0: "#ff0000",
};

type ViewMode = "markers" | "heatmap";

/**
 * Inner component that renders the canvas heatmap layer on the Leaflet map.
 * Uses useMap() to access the map instance, manages the layer lifecycle via useEffect.
 */
function HeatmapLayer({ data }: { data: [number, number, number][] }) {
    const map = useMap();

    useEffect(() => {
        if (data.length === 0) return;

        const heat = L.heatLayer(data, {
            radius: 25,
            blur: 20,
            maxZoom: 17,
            max: 1.0,
            minOpacity: 0.35,
            gradient: HEATMAP_GRADIENT,
        }).addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [map, data]);

    return null;
}

export default function ComplaintsMap({ points }: { points: ComplaintMapPoint[] }) {
    const [viewMode, setViewMode] = useState<ViewMode>("heatmap");

    const heatData = useMemo<[number, number, number][]>(
        () =>
            points.map((p) => [
                p.latitude,
                p.longitude,
                PRIORITY_WEIGHT[p.priority ?? ""] ?? 0.5,
            ]),
        [points]
    );

    if (points.length === 0) {
        return (
            <div className="h-[400px] flex items-center justify-center text-sm text-text-muted">
                No map data available.
            </div>
        );
    }

    const center: [number, number] = [points[0].latitude, points[0].longitude];

    return (
        <div>
            {/* Toggle */}
            <div className="flex items-center gap-1 px-5 py-3 border-b border-border">
                <button
                    type="button"
                    onClick={() => setViewMode("heatmap")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        viewMode === "heatmap"
                            ? "bg-violet-600 text-white"
                            : "bg-surface-raised text-text-secondary hover:bg-violet-50 hover:text-violet-700"
                    }`}
                >
                    Heatmap
                </button>
                <button
                    type="button"
                    onClick={() => setViewMode("markers")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        viewMode === "markers"
                            ? "bg-violet-600 text-white"
                            : "bg-surface-raised text-text-secondary hover:bg-violet-50 hover:text-violet-700"
                    }`}
                >
                    Markers
                </button>
            </div>

            <MapContainer center={center} zoom={12} style={{ height: "400px", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                {viewMode === "markers" &&
                    points.map((p) => (
                        <CircleMarker
                            key={p.id}
                            center={[p.latitude, p.longitude]}
                            radius={8}
                            pathOptions={{
                                color: STATUS_COLORS[p.status] || "#9ca3af",
                                fillColor: STATUS_COLORS[p.status] || "#9ca3af",
                                fillOpacity: 0.6,
                            }}
                        >
                            <Popup>
                                <div className="text-xs">
                                    <p className="font-semibold">{p.department_name}</p>
                                    <p>{p.category || "Uncategorized"}</p>
                                    <p className="capitalize">{p.status.replace("_", " ")}</p>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}

                {viewMode === "heatmap" && <HeatmapLayer data={heatData} />}
            </MapContainer>
        </div>
    );
}