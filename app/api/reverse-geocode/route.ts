import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Latitude (lat) and longitude (lon) parameters are required." },
        { status: 400 }
      );
    }

    // Call free Nominatim OpenStreetMap API with a required custom User-Agent header
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          "User-Agent": "CivicPulse-Grievance-App/1.0 (contact: support@civicpulse.org)",
          "Accept-Language": "en",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API returned status: ${response.status}`);
    }

    const data = await response.json();
    const address = data.display_name || "Unknown Location";

    return NextResponse.json({ address });
  } catch (err) {
    console.error("[ReverseGeocode API] Error during reverse geocoding:", err);
    return NextResponse.json(
      { error: "Failed to reverse geocode coordinates." },
      { status: 500 }
    );
  }
}
