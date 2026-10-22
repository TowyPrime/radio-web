"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import type { LiveStatus } from "@/lib/live/types";

interface LiveEmbedProps {
  /** Estado que calculó el servidor al cargar la página */
  initialStatus: LiveStatus;
  /** Reproductor genérico del canal, para cuando no se puede saber si hay directo */
  fallbackEmbedUrl: string;
}

const POLL_SECONDS = 30;

const IFRAME_ALLOW =
  "autoplay; encrypted-media; picture-in-picture; fullscreen";

export default function LiveEmbed({
  initialStatus,
  fallbackEmbedUrl,
}: LiveEmbedProps) {
  const [status, setStatus] = useState<LiveStatus>(initialStatus);
  const canDetect = initialStatus.configured;

  // Pregunta cada 30 s si el canal ya está en vivo (solo con la pestaña a la vista, y también
  // al volver a ella). El reproductor de YouTube no se entera solo de que empezó el directo.
  useEffect(() => {
    if (!canDetect) return;

    const checkStatus = async () => {
      if (document.visibilityState !== "visible") return;

      try {
        const response = await fetch("/api/live-status");
        if (!response.ok) return;

        const next: LiveStatus = await response.json();
        setStatus((prev) =>
          prev.isLive === next.isLive && prev.videoId === next.videoId
            ? prev
            : next,
        );
      } catch {
        // Sin conexión o error momentáneo: se reintenta en el siguiente ciclo
      }
    };

    const interval = setInterval(checkStatus, POLL_SECONDS * 1000);
    document.addEventListener("visibilitychange", checkStatus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", checkStatus);
    };
  }, [canDetect]);

  // Sin llave de la API: se mantiene el reproductor genérico de siempre
  if (!canDetect) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg">
        <iframe
          src={fallbackEmbedUrl}
          title="Transmisión en vivo de YouTube"
          className="absolute left-0 top-0 h-full w-full border-0"
          allow={IFRAME_ALLOW}
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  if (status.isLive && status.videoId) {
    return (
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-600/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-red-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            En vivo ahora
          </span>
          {status.title && (
            <span className="truncate text-sm text-ink-300">{status.title}</span>
          )}
        </div>
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg">
          <iframe
            // La clave hace que el reproductor se cree de nuevo si cambia el directo
            key={status.videoId}
            src={`https://www.youtube.com/embed/${status.videoId}?rel=0`}
            title="Transmisión en vivo de YouTube"
            className="absolute left-0 top-0 h-full w-full border-0"
            allow={IFRAME_ALLOW}
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-ink-800 bg-ink-900 px-6 text-center shadow-lg">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-400/10 text-brand-400">
        <Radio className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="text-lg font-semibold text-white">
        No hay transmisión en vivo en este momento
      </p>
      <p className="max-w-md text-sm text-ink-400">
        El video aparecerá aquí automáticamente cuando comience el directo.
        Mientras tanto, revisa la programación.
      </p>
    </div>
  );
}
