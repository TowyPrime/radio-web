import type { Metadata } from "next";
import { getNewsById } from "@/lib/news/queries";
import { SITE_NAME } from "@/lib/site";
import { htmlToPlainText } from "@/lib/news/sanitize";
import { NewsRecord } from "@/lib/news/types";
import { UUID_REGEX } from "@/lib/tracks/constants";
import { STATION_TIME_ZONE } from "@/lib/schedule/constants";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface NewsDetailsProps {
  params: Promise<{
    id: string;
  }>;
}

const META_DESCRIPTION_MAX_CHARS = 200;

// Resumen corto y en una sola línea para las vistas previas al compartir
function toMetaDescription(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > META_DESCRIPTION_MAX_CHARS
    ? `${clean.slice(0, META_DESCRIPTION_MAX_CHARS - 1).trimEnd()}…`
    : clean;
}

// Etiquetas que usan WhatsApp, Facebook, X, etc. para armar la vista previa del enlace
export async function generateMetadata({
  params,
}: NewsDetailsProps): Promise<Metadata> {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) return { title: "Noticia no encontrada" };

  let news: NewsRecord | null = null;

  try {
    news = await getNewsById(id);
  } catch (error) {
    console.error("Error al obtener la noticia para los metadatos:", error);
    return {};
  }

  if (!news) return { title: "Noticia no encontrada" };

  const description = toMetaDescription(news.summary);
  // Sin portada se usa el logo (la URL relativa se resuelve con metadataBase)
  const image = news.cover_url ?? "/icon.jpg";

  return {
    title: news.title,
    description,
    alternates: { canonical: `/news/${news.id}` },
    // openGraph reemplaza al del layout (no se mezclan), por eso se repite siteName y locale
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: "es_MX",
      url: `/news/${news.id}`,
      title: news.title,
      description,
      publishedTime: news.created_at,
      modifiedTime: news.updated_at ?? undefined,
      authors: news.author_name ? [news.author_name] : undefined,
      section: news.category || undefined,
      images: [{ url: image, alt: news.title }],
    },
    twitter: {
      card: news.cover_url ? "summary_large_image" : "summary",
      title: news.title,
      description,
      images: [image],
    },
  };
}

export default async function NewsDetailsPage({ params }: NewsDetailsProps) {
  let news: NewsRecord | null = null;

  const { id } = await params;
  if (!id) notFound();

  if (typeof id !== "string" || !UUID_REGEX.test(id)) notFound();

  try {
    news = await getNewsById(id);
  } catch {
    notFound();
  }

  if (!news) notFound();

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
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-ink-950 text-ink-100 w-full pb-16">
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Enlace para volver a la lista de noticias */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a noticias
        </Link>

        <article className="space-y-6">
          {/* Encabezado: Categoría, Título, Meta y Resumen */}
          <header className="space-y-4">
            {news.category && (
              <span className="text-xs font-bold tracking-wider text-brand-400 uppercase">
                {news.category}
              </span>
            )}

            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              {news.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-ink-400 border-b border-ink-800 pb-6">
              {news.author_name && <span>{news.author_name}</span>}
              {news.author_name && news.created_at && <span>·</span>}
              {news.created_at && <span>{formatDate(news.created_at)}</span>}
              <span>·</span>
              <span className="flex items-center gap-1.5 text-ink-400">
                <Clock className="w-4 h-4 text-ink-500" />
                {getLectureMinutes(news)} min de lectura
              </span>
            </div>

            {news.summary && (
              <p className="text-lg md:text-xl text-ink-300 font-medium leading-relaxed italic">
                {news.summary}
              </p>
            )}
          </header>

          {/* Portada (si existe) */}
          {news.cover_url && (
            <div className="relative aspect-video max-h-[450px] w-full overflow-hidden rounded-2xl border border-ink-800 bg-ink-900">
              <Image
                src={news.cover_url}
                alt={news.title}
                fill
                priority
                sizes="(min-width: 896px) 896px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          {/* Contenido HTML de la noticia */}
          <div
            className="news-content max-w-none text-ink-200 leading-relaxed space-y-4 pt-4"
            dangerouslySetInnerHTML={{ __html: news.body }}
          />
        </article>
      </main>
    </div>
  );
}
