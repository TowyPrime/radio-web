import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { VISITOR_COOKIE_NAME } from "@/utils/supabase/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = body?.username;

    const supabase = await createServiceRoleClient();
    const cookieStore = await cookies();
    const cookieName = VISITOR_COOKIE_NAME;
    const visitorToken = cookieStore.get(cookieName)?.value;

    // Comprobación de identidad previa (Cookie)
    if (visitorToken) {
      const { data: visitor, error } = await supabase
        .from("visitors")
        .select("username")
        .eq("token", visitorToken)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new Error(`La consulta falló: ${error.message}`);
      }

      if (visitor) {
        return NextResponse.json(
          {
            error: "Ya has seleccionado un nombre de usuario antes",
            username: visitor.username,
          },
          { status: 409 }
        );
      }
    }

    // Validaciones de formato y reglas de negocio del username
    if (typeof username !== "string") {
      return NextResponse.json({ error: "El nombre de usuario es obligatorio" }, { status: 400 });
    }

    const clearUserName = username.trim().replace(/\s+/g, " ");

    if (!clearUserName) {
      return NextResponse.json({ error: "El nombre de usuario no puede quedar vacío" }, { status: 400 });
    }

    if (clearUserName.length < 3 || clearUserName.length > 30) {
      return NextResponse.json({ error: "El nombre de usuario debe tener entre 3 y 30 caracteres" }, { status: 400 });
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9 _-]+$/.test(clearUserName)) {
      return NextResponse.json({ error: "El nombre de usuario contiene caracteres no permitidos" }, { status: 400 });
    }

    const reservedUsernames = ["admin", "administrador", "con el pie derecho radio"];
    if (reservedUsernames.includes(clearUserName.toLocaleLowerCase())) {
      return NextResponse.json({ error: "El nombre de usuario ingresado está reservado por el sistema" }, { status: 409 });
    }

    // Inserción en la base de datos (Postgres genera uid, token y created_at por defecto)
    const { data: newVisitor, error: insertError } = await supabase
      .from("visitors")
      .insert({ username: clearUserName })
      .select("token, username")
      .single();

    // Manejo de errores de inserción (como la condición de carrera 23505)
    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Lo sentimos, ese nombre de usuario acaba de ser registrado por otra persona. Por favor, elige otro." },
          { status: 409 }
        );
      }
      throw new Error(`Error al insertar en la base de datos: ${insertError.message}`);
    }

    // Respuesta JSON con datos públicos y asignación segura de la cookie de sesión
    const response = NextResponse.json(
      { 
        success: "El nombre de usuario fue agregado correctamente", 
        username: newVisitor.username 
      },
      { status: 201 }
    );

    response.cookies.set({
      name: cookieName,
      value: newVisitor.token, // El token secreto que devolvió la base de datos
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 31536000, 
    });

    return response;

  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "El formato del cuerpo de la petición es inválido" },
        { status: 400 }
      );
    }

    // Comprobación real en tiempo de ejecución para extraer el mensaje de forma segura
    const message = error instanceof Error 
      ? error.message 
      : "Ocurrió un error inesperado en el servidor";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}