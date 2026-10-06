import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/service";
import { requireAdmin } from "@/utils/supabase/adminGuard";
import { ALLOWED_FILE_TYPES, BUCKET_NAME} from "@/lib/tracks/constants";



export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }
    const body = await request.json();

    if(!body){
        return NextResponse.json(
            {error: "El cuerpo de la petición es requerido"},
            {status: 400}
        );
    }

    const { fileType } = body;

    if (!fileType) {
      return NextResponse.json(
        { error: "El tipo de archivo es requerido" },
        { status: 400 },
      );
    }

    const fileExtension = ALLOWED_FILE_TYPES.get(fileType);
    if (!fileExtension) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido" },
        { status: 400 },
      );
    }

    const filePath = `uploads/${crypto.randomUUID()}.${fileExtension}`;
    const bucketName = BUCKET_NAME;

    const admin = createServiceRoleClient();

    const { data: signedUrlData, error: signedUrlError } = await admin.storage.from(bucketName)
    .createSignedUploadUrl(filePath);

    if (signedUrlError) {
        console.error("Error al generar la URL de subida:", signedUrlError);

        return NextResponse.json(
            {error: "Error al generar la URL de subida"},
            {status: 500}    
        );
        
    }

    return NextResponse.json({
        signedUrl: signedUrlData.signedUrl,
        token: signedUrlData.token,
        path:signedUrlData.path,
    });
  } catch (error: unknown) {
   if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "El formato del cuerpo de la petición es inválido" },
        { status: 400 },
      );
    }

    console.error("Error inesperado en el servidor:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor. Por favor, inténtalo más tarde." }, 
      { status: 500 }
    );
  }
}
