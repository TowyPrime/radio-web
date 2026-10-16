import { notify } from "@/components/toast";
import { getNewsById } from "@/lib/news/queries";
import { htmlToPlainText } from "@/lib/news/sanitize";
import { NewsRecord } from "@/lib/news/types";
import { UUID_REGEX } from "@/lib/tracks/constants";
import { STATION_TIME_ZONE } from "@/lib/schedule/constants";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock} from "lucide-react";
import Link from "next/link";

interface NewsDetailsProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NewsDEtailsPage({ params }: NewsDetailsProps) {
  let news: NewsRecord | null = null;
  let errorMessage: string | null = null;
  const { id } = await params;

  if (typeof id !== "string" || !UUID_REGEX.test(id)) {
    errorMessage = "El id especificado no es válido";
  }

  try {
    news = await getNewsById(id);
  } catch (error) {
    console.error(
      "Ocurrió un error al consultar la noticia intenta de nuevo",
      error,
    );
    errorMessage = "No se pudo obtener la noticia especificada";
  }

  if (!news) {
    errorMessage = "No se pudo enctrar la noticia especificada";
    notFound();
  }
  const getLectureMinutes = (news: NewsRecord) => {
    const plainText = htmlToPlainText(news.body || "");
    const words = plainText.trim().split(/\s+/).filter(Boolean);
    const lectureReadMinutes = Math.max(1, Math.ceil(words.length / 200));

    return lectureReadMinutes;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Intl.DateTimeFormat("es-ES", {
        timeZone: STATION_TIME_ZONE,
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(dateString));
    } catch{
      return dateString;
    }
  };

 return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 w-full pb-16">
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Enlace para volver a la lista de noticias */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a noticias
        </Link>
         {errorMessage && (
          <div className="p-4 mb-6 text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-xl">
            {errorMessage}
          </div>
        )}

        <article className="space-y-6">
          {/* Encabezado: Categoría, Título, Meta y Resumen */}
          <header className="space-y-4">
            {news.category && (
              <span className="text-xs font-bold tracking-wider text-blue-400 uppercase">
                {news.category}
              </span>
            )}

            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              {news.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 border-b border-slate-800 pb-6">
              {news.author_name && <span>{news.author_name}</span>}
              {news.author_name && news.created_at && <span>·</span>}
              {news.created_at && <span>{formatDate(news.created_at)}</span>}
              <span>·</span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-4 h-4 text-slate-500" />
                {getLectureMinutes(news)} min de lectura
              </span>
            </div>

            {news.summary && (
              <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed italic">
                {news.summary}
              </p>
            )}
          </header>

          {/* Portada (si existe) */}
          {news.cover_url && (
            <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-[450px] bg-slate-900">
              <img
                src={news.cover_url}
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Contenido HTML de la noticia */}
          <div
            className="news-content max-w-none text-slate-200 leading-relaxed space-y-4 pt-4"
            dangerouslySetInnerHTML={{ __html: news.body }}
          />
        </article>
      </main>
    </div>
  );
}
