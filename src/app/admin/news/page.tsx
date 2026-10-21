import NewsManager from "@/components/NewsManager";
import { getNews } from "@/lib/news/queries";
import { NewsRecord } from "@/lib/news/types";

// Lee datos con la sesión (cookies): siempre se genera en cada petición
export const dynamic = "force-dynamic";

export default async function CrateNewsPage() {
  let news: NewsRecord[] = [];
  let errorMessage: string | null = null;

  try {
    news = await getNews();
  } catch (error) {
    console.error("Ocurrió un error al intentar obtener las noticias:", error);
    errorMessage =
      "No se pudieron cargar las noticias en este momento. Intenta recargar la página.";
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      {errorMessage && (
        <p className="mb-4 text-sm text-red-400">{errorMessage}</p>
      )}
      <NewsManager initialNews={news} />
    </div>//
  );
}
