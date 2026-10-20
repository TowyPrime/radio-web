import ChatPanel from "@/components/ChatPanel";
import { getUpcomingSlots } from "@/lib/schedule/queries";
import { Slot } from "@/lib/schedule/types";
import { STATION_TIME_ZONE } from "@/lib/schedule/constants";
import AutoRefresh from "@/components/AutoRefresh";
import { getYoutubeEmbedUrl } from "@/lib/live/youtube";

export const dynamic = "force-dynamic";

// Formateador para la cabecera de cada día (ej: "martes, 20 de octubre de 2026")
const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  timeZone: STATION_TIME_ZONE,
  dateStyle: "full",
});

// Formateador para mostrar el rango completo de fecha y hora en "Al aire" / "Próximamente"
const fullDateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  timeZone: STATION_TIME_ZONE,
  dateStyle: "medium",
  timeStyle: "short",
});

// Formateador exclusivo para las horas en la lista agrupada (ej: "18:00")
const timeFormatter = new Intl.DateTimeFormat("es-ES", {
  timeZone: STATION_TIME_ZONE,
  timeStyle: "short",
});

const formatDateLabel = (dateString?: string) => {
  if (!dateString) return "";
  return dateFormatter.format(new Date(dateString));
};

const formatFullDateTime = (dateString?: string) => {
  if (!dateString) return "";
  return fullDateTimeFormatter.format(new Date(dateString));
};

const formatTime = (dateString?: string) => {
  if (!dateString) return "";
  return timeFormatter.format(new Date(dateString));
};

export default async function LivePage() {
  let slots: Slot[] = [];
  let errorMessage: string | null = null;

  try {
    slots = await getUpcomingSlots();
  } catch (error) {
    console.error("Ocurrió un error al intentar obtener los horarios:", error);
    errorMessage =
      "No se pudieron cargar los horarios en este momento. Intenta recargar la página.";
  }

  const now = new Date();

  const liveSlot = slots.find((slot) => {
    const start = new Date(slot.starts_at);
    const end = new Date(slot.ends_at);
    return now >= start && now < end;
  });

  // Agrupar slots por día de inicio
  const slotsByDay = new Map<string, Slot[]>();
  for (const slot of slots) {
    const dayKey = formatDateLabel(slot.starts_at);
    const daySlots = slotsByDay.get(dayKey) || [];
    daySlots.push(slot);
    slotsByDay.set(dayKey, daySlots);
  }

  const youtubeEmbedUrl = getYoutubeEmbedUrl();

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <AutoRefresh intervalSeconds={60} />
      <h1 className="text-3xl font-bold text-white mb-1">
        Nuestra Emisora en Vivo
      </h1>
      <p className="text-slate-400 text-sm mb-8">
        Escucha la transmisión, conversa con el locutor y consulta la
        programación.
      </p>

      {/* Mensaje de error */}
      {errorMessage && (
        <p className="mb-4 text-sm text-red-400">{errorMessage}</p>
      )}

      {youtubeEmbedUrl ? (
        <div className="mb-8 w-full max-w-4xl mx-auto">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
            <iframe
              src={youtubeEmbedUrl}
              title="Transmisión en vivo de Youtube"
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Columna izquierda: programa actual + programación */}
        <div className="lg:col-span-3 space-y-6">
          {liveSlot ? (
            <section className="rounded-2xl p-6 bg-gradient-to-br from-blue-700 to-indigo-950 border border-blue-500/30 shadow-xl">
              <span className="inline-flex items-center gap-2 bg-red-600/20 text-red-300 border border-red-500/40 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Al aire
              </span>
              <h2 className="text-3xl font-bold text-white mt-4">
                {liveSlot.playlist_title}
              </h2>
              <p className="text-blue-200 mt-1">
                Comienzo: {formatFullDateTime(liveSlot.starts_at)} hasta:{" "}
                {formatTime(liveSlot.ends_at)}
              </p>
              <p className="text-sm text-blue-100/80 mt-4 max-w-md">
                Pulsa el botón de reproducir del reproductor superior para
                sintonizar la emisora.
              </p>
            </section>
          ) : (
            <section className="rounded-2xl p-6 bg-gradient-to-br from-blue-700 to-indigo-950 border border-blue-500/30 shadow-xl">
              <span className="inline-flex items-center gap-2 bg-amber-600/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Próximamente
              </span>
              <h2 className="text-2xl font-bold text-white mt-4">
                {slots[0]
                  ? slots[0].playlist_title
                  : "No hay evento en vivo ahora."}
              </h2>
              <p className="text-blue-200 mt-1">
                {slots[0]
                  ? `Comienzo: ${formatFullDateTime(slots[0].starts_at)}`
                  : "Vuelve más tarde para ver nuevos horarios."}
              </p>
              <p className="text-sm text-slate-300/80 mt-4 max-w-md">
                En este momento no hay ninguna transmisión en vivo. Mantente
                atento a nuestra programación.
              </p>
            </section>
          )}

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-6 text-lg border-b border-slate-800 pb-3">
              Programación
            </h2>
            {slots.length === 0 ? (
              <p className="text-slate-400 text-sm">
                Aún no hay programación publicada.
              </p>
            ) : (
              <div className="space-y-6">
                {Array.from(slotsByDay.entries()).map(
                  ([dayLabel, daySlots]) => (
                    <div key={dayLabel} className="space-y-3">
                      <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                        {dayLabel}
                      </h3>
                      <ul className="divide-y divide-slate-800/60 bg-slate-950/40 rounded-xl px-4 border border-slate-800/50">
                        {daySlots.map((slot) => (
                          <li
                            key={slot.id}
                            className="flex items-center gap-4 py-3"
                          >
                            <span className="w-32 text-xs font-mono text-slate-400">
                              {formatTime(slot.starts_at)} –{" "}
                              {formatTime(slot.ends_at)}
                            </span>
                            <div className="flex-1">
                              <p
                                className={`text-sm font-medium ${
                                  slot.id === liveSlot?.id
                                    ? "text-white font-semibold"
                                    : "text-slate-200"
                                }`}
                              >
                                {slot.playlist_title}
                              </p>
                            </div>
                            {slot.id === liveSlot?.id && (
                              <span className="text-[10px] font-bold uppercase text-red-400 bg-red-600/20 border border-red-500/30 px-2 py-0.5 rounded-full">
                                En vivo
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>
        </div>

        {/* Columna derecha: chat */}
        <div className="lg:col-span-2">
          <ChatPanel className="h-[32rem]" />
        </div>
      </div>
    </main>
  );
}
