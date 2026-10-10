import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { requireAdmin } from "@/utils/supabase/adminGuard";
import { Playlist, PlaylistRecord } from "@/services/audioService/types";

export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

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

    const { title } = body;

    if (typeof title !== "string") {
      return NextResponse.json(
        { error: "El titulo de la playlist debe ser un string" },
        { status: 400 },
      );
    }

    if (title.trim().length === 0) {
      return NextResponse.json(
        { error: "El titulo es obligatorio, no puede quedar vacío" },
        { status: 400 },
      );
    }

    if (title.trim().length < 1 || title.trim().length > 50) {
      return NextResponse.json(
        { error: "El titulo debe tener entre 1 y 50 caracteres" },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("playlists")
      .insert({ title: title.trim() })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "Ya existe un registro con esta playlist, intenta con un titulo diferente.",
          },
          { status: 409 },
        );
      }

      if (error.code === "23514") {
        return NextResponse.json(
          {
            error:
              "Los datos proporcionados violan las restricciones de la base de datos.",
          },
          { status: 400 },
        );
      }

      console.error("Error inesperado de la base de datos:", error);
      return NextResponse.json(
        { error: "Ocurrió un error al intentar crear la playlist" },
        { status: 500 },
      );
    }

    return NextResponse.json({ playlist: data }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error inesperado en POST api/admin/playlists:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const adminCheck = await requireAdmin();

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("playlists")
      .select("* , playlist_tracks(count)")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "La playlist solicitada no fue encontrada" },
          { status: 404 },
        );
      }
      console.error("Ocurrió un error en la consulta playlists:", error);
      return NextResponse.json(
        { error: "Ocurrió un error al consultar las playlists" },
        { status: 500 },
      );
    }

    const rawRow = (data ?? []) as unknown as PlaylistRecord[];

    const playlists: Playlist[] = rawRow.map((item) => ({
      id: item.id,
      title: item.title,
      created_at: item.created_at,
      track_count: item.playlist_tracks?.[0]?.count ?? 0,
    }));

    return NextResponse.json({ playlists });
  } catch (error: unknown) {
    console.error("Ocurrió un error inesperado en el servidor:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al traer las playlists" },
      { status: 500 },
    );
  }
}
