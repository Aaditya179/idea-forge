"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { ComplaintMapPoint } from "@/lib/queries/complaints";

const STATUS_COLORS: Record<string, string> = {
    submitted: "#3b82f6",
    in_review: "#f59e0b",
    assigned: "#8b5cf6",
    resolved: "#10b981",
    rejected: "#ef4444",
};

export default function ComplaintsMap({ points }: { points: ComplaintMapPoint[] }) {
    if (points.length === 0) {
        return (
            <div className="h-[400px] flex items-center justify-center text-sm text-text-muted">
                No geo-tagged complaints yet
            </div>
        );
    }

    const center: [number, number] = [points[0].latitude, points[0].longitude];

    return (
        <MapContainer center={center} zoom={12} style={{ height: "400px", width: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />
            {points.map((p) => (
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
        </MapContainer>
    );
}