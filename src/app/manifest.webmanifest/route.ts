
import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: "SCRBRD - Cricket Scorer",
    short_name: "SCRBRD",
    description: "A modern cricket scoring and management tool.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#1e293b",
    theme_color: "#10b981",
    icons: [
      {
        "src": "https://placehold.co/192x192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "https://placehold.co/512x512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ]
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
    },
  });
}
