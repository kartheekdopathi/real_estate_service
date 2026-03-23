import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().trim().min(2).max(160),
});

type GoogleGeocodeResponse = {
  status: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  }>;
};

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid location query." }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GOOGLE_MAPS_API_KEY in environment." },
      { status: 500 },
    );
  }

  const q = parsed.data.q;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    const data = (await response.json()) as GoogleGeocodeResponse;

    if (!response.ok) {
      return NextResponse.json({ error: "Geocode request failed." }, { status: 502 });
    }

    if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) {
      return NextResponse.json(
        { error: data.error_message || "Location not found." },
        { status: 404 },
      );
    }

    const first = data.results[0];
    const lat = first.geometry?.location?.lat;
    const lng = first.geometry?.location?.lng;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "Location coordinates unavailable." }, { status: 404 });
    }

    return NextResponse.json({
      query: q,
      result: {
        lat,
        lng,
        formattedAddress: first.formatted_address ?? q,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to geocode location." }, { status: 502 });
  }
}
