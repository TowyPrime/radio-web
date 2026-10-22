import { NextResponse } from "next/server";
import { getLiveStatus } from "@/lib/live/youtube";

export const dynamic = "force-dynamic";

// Público: solo dice si el canal está en vivo (sin datos sensibles).
// La caché del CDN absorbe a los visitantes que preguntan cada 30 segundos.
export async function GET() {
  try {
    const status = await getLiveStatus();

    return NextResponse.json(status, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error: unknown) {
    console.error("Error inesperado en GET api/live-status:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}
