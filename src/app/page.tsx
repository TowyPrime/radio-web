import Link from "next/link";
import { NewsSummary } from "@/lib/news/types";
import { getNewsSummaries } from "@/lib/news/queries";
import { STATION_TIME_ZONE } from "@/lib/schedule/constants";

export default async function Home() {
  let listNews: NewsSummary[] = [];
  let errorMessage: string | null = null;

  try {
    listNews = await getNewsSummaries();
  } catch (error) {
    console.error("Ocurrió un error al intentar obtener noticias:", error);
    errorMessage =
      "No se pudieron cargar las noticias en este momento. Intenta recargar la página.";
  }

  // Función auxiliar para formatear la fecha con la zona horaria de la estación
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Intl.DateTimeFormat("es-ES", {
        timeZone: STATION_TIME_ZONE,
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  const leadNews = listNews[0];
  const restNews = listNews.slice(1);

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 w-full pb-16">
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Noticias</h1>

        {errorMessage && (
          <div className="p-4 mb-6 text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* Si no hay noticias publicadas */}
        {listNews.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <p className="text-lg text-slate-400">Aún no hay noticias publicadas</p>
          </div>
        ) : (
          <>
            {/* Noticia destacada */}
            {leadNews && (
              <Link href={`/news/${leadNews.id}`} className="block group mb-8">
                <article className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 grid md:grid-cols-2 group-hover:border-slate-700 transition-colors">
                  {/* Portada o Imagen de reemplazo */}
                  {leadNews.cover_url ? (
                    <div className="h-64 md:h-full min-h-[13rem] relative overflow-hidden bg-slate-950">
                      <img
                        src={leadNews.cover_url}
                        alt={leadNews.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="min-h-[13rem] bg-gradient-to-br from-blue-600 to-indigo-900" />
                  )}

                  <div className="p-6 md:p-8 flex flex-col justify-center gap-3">
                    {leadNews.category && (
                      <span className="text-xs font-bold tracking-wider text-blue-400 uppercase">
                        {leadNews.category}
                      </span>
                    )}
                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">
                      {leadNews.title}
                    </h2>
                    {leadNews.summary && (
                      <p className="text-slate-400 line-clamp-3">{leadNews.summary}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                      <span>{leadNews.author_name}</span>
                      {leadNews.author_name && leadNews.created_at && <span>·</span>}
                      <span>{formatDate(leadNews.created_at)}</span>
                    </div>
                  </div>
                </article>
              </Link>
            )}

            {/* Resto de noticias (Cuadrícula) */}
            {restNews.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {restNews.map((n) => (
                  <Link key={n.id} href={`/news/${n.id}`} className="flex group">
                    <article className="w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 flex flex-col group-hover:border-slate-700 transition-colors">
                      {/* Portada o Imagen de reemplazo */}
                      {n.cover_url ? (
                        <div className="h-44 relative overflow-hidden bg-slate-950">
                          <img
                            src={n.cover_url}
                            alt={n.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-44 bg-gradient-to-br from-blue-600 to-indigo-900" />
                      )}

                      <div className="p-5 flex flex-col gap-2 flex-1">
                        {n.category && (
                          <span className="text-[11px] font-bold tracking-wider text-blue-400 uppercase">
                            {n.category}
                          </span>
                        )}
                        <h3 className="text-lg font-semibold text-white leading-snug group-hover:text-blue-400 transition-colors">
                          {n.title}
                        </h3>
                        {n.summary && (
                          <p className="text-sm text-slate-400 flex-1 line-clamp-3">
                            {n.summary}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-800/50 mt-auto">
                          <span>{n.author_name}</span>
                          {n.author_name && n.created_at && <span>·</span>}
                          <span>{formatDate(n.created_at)}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Botón flotante del chat */}
      <Link
        href="/chat"
        className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-400/50"
        aria-label="Abrir chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </Link>
    </div>
  );
}