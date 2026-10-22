import MessagesManager from "@/components/MessagesManager";
import { getContactMessages } from "@/lib/contact/queries";
import type { ContactMessage } from "@/lib/contact/types";

// Lee datos con la sesión de administración: siempre se genera en cada petición
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  let messages: ContactMessage[] = [];
  let errorMessage: string | null = null;

  try {
    messages = await getContactMessages();
  } catch (error) {
    console.error("Ocurrió un error al intentar obtener los mensajes:", error);
    errorMessage =
      "No se pudieron cargar los mensajes en este momento. Intenta recargar la página.";
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      {errorMessage && (
        <p className="mb-4 text-sm text-red-400">{errorMessage}</p>
      )}
      <MessagesManager initialMessages={messages} />
    </div>
  );
}
