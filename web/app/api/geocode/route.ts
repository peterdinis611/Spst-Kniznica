import { NextResponse } from "next/server";

export const runtime = "nodejs";

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q =
    searchParams.get("q")?.trim() ||
    process.env.NEXT_PUBLIC_LIBRARY_ADDRESS?.trim() ||
    "Stredná priemyselná škola, Slovensko";

  try {
    const url =
      "https://nominatim.openstreetmap.org/search" +
      `?q=${encodeURIComponent(q)}&format=json&limit=1`;

    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "SPST-Kniznica/1.0 (school-library)",
        "Accept-Language": "sk",
      },
      next: { revalidate: 86_400 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { title: "Geocode failed", status: upstream.status },
        { status: 502 },
      );
    }

    const hits = (await upstream.json()) as NominatimHit[];
    if (!hits.length) {
      return NextResponse.json({ title: "Not found", status: 404 }, { status: 404 });
    }

    const hit = hits[0]!;
    const lat = Number(hit.lat);
    const lon = Number(hit.lon);

    return NextResponse.json({
      query: q,
      displayName: hit.display_name,
      lat,
      lon,
      osmEmbedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01}%2C${lat - 0.007}%2C${lon + 0.01}%2C${lat + 0.007}&layer=mapnik&marker=${lat}%2C${lon}`,
      osmUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`,
    });
  } catch {
    return NextResponse.json(
      { title: "Geocode unreachable", status: 502 },
      { status: 502 },
    );
  }
}
