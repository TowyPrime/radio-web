import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import {
  CONTACT_HONEYPOT_FIELD,
  CONTACT_RATE_LIMIT,
} from "@/lib/contact/constants";
import { parseContactInput } from "@/lib/contact/validate";

export const dynamic = "force-dynamic";

const MS_PER_MINUTE = 60 * 1000;

// Resumen irreversible de la IP del remitente: permite limitar el spam sin guardar la IP.
// Se firma con la llave del servidor (HMAC) para que no se pueda deducir la IP del resumen.
function hashClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "desconocida";

  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHmac("sha256", secret).update(ip).digest("hex");
}

// Pública: la usan visitantes sin sesión desde el formulario de contacto
export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "El formato del cuerpo de la petición es inválido" },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "El cuerpo de la petición es requerido y debe ser un objeto" },
        { status: 400 },
      );
    }

    // Trampa para bots: si el campo oculto viene relleno, se responde "enviado" sin guardar
    // nada, para que el bot no sepa que fue descubierto
    const honeypot = (body as Record<string, unknown>)[CONTACT_HONEYPOT_FIELD];
    if (typeof honeypot === "string" && honeypot.trim().length > 0) {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const parsed = parseContactInput(body as Record<string, unknown>);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const ipHash = hashClientIp(request);

    const windowStart = new Date(
      Date.now() - CONTACT_RATE_LIMIT.windowMinutes * MS_PER_MINUTE,
    ).toISOString();

    const { count, error: countError } = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", windowStart);

    if (countError) {
      console.error("Error al comprobar el límite de mensajes:", countError);
      return NextResponse.json(
        { error: "Ocurrió un error al enviar el mensaje. Intenta más tarde." },
        { status: 500 },
      );
    }

    if ((count ?? 0) >= CONTACT_RATE_LIMIT.maxMessages) {
      return NextResponse.json(
        {
          error: `Has enviado varios mensajes seguidos. Espera ${CONTACT_RATE_LIMIT.windowMinutes} minutos e inténtalo de nuevo.`,
        },
        { status: 429 },
      );
    }

    const { error: insertError } = await supabase
      .from("contact_messages")
      .insert({
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
        ip_hash: ipHash,
      });

    if (insertError) {
      if (insertError.code === "23514") {
        return NextResponse.json(
          {
            error:
              "Los datos proporcionados violan las restricciones de la base de datos",
          },
          { status: 400 },
        );
      }

      console.error("Error al guardar el mensaje de contacto:", insertError);
      return NextResponse.json(
        { error: "Ocurrió un error al enviar el mensaje. Intenta más tarde." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error inesperado en POST api/contact:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}
