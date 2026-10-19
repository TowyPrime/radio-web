"use client";

import { Playlist } from "@/services/audioService/types";
import { useCallback, useEffect, useState } from "react";
import { notify } from "./toast";
import { AppError } from "@/data/AppError";
import { Slot } from "@/lib/schedule/types";
import { Trash2 } from "lucide-react";
import { STATION_TIME_ZONE } from "@/lib/schedule/constants";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  timeZone: STATION_TIME_ZONE,
  dateStyle: "medium",
  timeStyle: "short",
});

export default function ScheduleManager() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [playlistId, setPlaylistId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSlots = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/schedule", { method: "GET" });

      if (!response.ok) {
        notify.error("Ocurrió un error en la consulta de horarios");
        return;
      }

      const data: { slots: Slot[] } = await response.json();

      setSlots(data.slots || []);
    } catch (error) {
      console.error("Ocurrió un error en la consulta de horarios", error);
      notify.error("Ocurrió un error indefinido en la consulta");
    }
  }, []);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await fetch("/api/admin/playlists");

        if (!response.ok) {
          notify.error("Ocurrió un error en la consulta de playlists");
          return;
        }

        const data: { playlists: Playlist[] } = await response.json();
        setPlaylists(data.playlists || []);
      } catch (error) {
        console.error("Ocurrió un error en la consulta de playlists:", error);
        notify.error("Ocurrió un error indefinido en la consulta");
      }
    };

    const timer = setTimeout(() => {
      loadSlots();
      fetchPlaylists();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadSlots]);

  const cleanFields = () => {
    setStartsAt("");
    setEndsAt("");
    setPlaylistId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!startsAt || !endsAt) {
      notify.error("Las horas de inicio y fin son requeridas");
      return;
    }

    if (!playlistId) {
      notify.error("Es necesario seleccionar una playlist");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlist_id: playlistId,
          starts_at: startsAt,
          ends_at: endsAt,
        }),
      });

      const dataSchedule = await response.json();

      if (!response.ok) {
        throw new AppError(
          dataSchedule?.error || "Ocurrió un error al crear el horario",
        );
      }

      notify.success("El horario se creó correctamente");
      cleanFields();
      loadSlots();
    } catch (error: unknown) {
     if (!(error instanceof AppError)) {
        console.error("Error al agregar el horario:", error);
      }
      const errorMessage =
        error instanceof AppError
          ? error.message
          : "Ocurrió un problema al procesar tu solicitud, inténtalo de nuevo más tarde.";

      notify.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (slot: Slot) => {
    const id = slot.id;
    const slotStartsAt = new Date(slot.starts_at);
    const slotEndsAt = new Date(slot.ends_at);
    const now = new Date();

    const isLive = now >= slotStartsAt && now < slotEndsAt;

    if (isLive) {
      const airConfirmed = window.confirm(
        "⚠️ Atención: Este horario está en vivo y activo. Eliminarlo detendrá la transmisión actual. ¿Estás seguro de continuar?",
      );

      if (!airConfirmed) return;
    } else {
      const confirmed = window.confirm(
        "¿Estás seguro de querer eliminar este horario? Esta es una acción irreversible",
      );
      if (!confirmed) return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/admin/schedule/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AppError(data.error || "No se pudo eliminar el horario");
      }

      loadSlots();
      notify.success("Se eliminó correctamente el horario");
    } catch (error: unknown) {
      if (!(error instanceof AppError)) {
        console.error("Error al eliminar horario:", error);
      }
      const errorMessage =
        error instanceof AppError
          ? error.message
          : "Ocurrió un problema al procesar tu solicitud, inténtalo de nuevo más tarde.";

      notify.error(errorMessage);
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className=" mx-auto px-4 md:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Crear horario</h1>
      <p className="text-slate-400 text-sm mb-6">
        Crea un horario para llevar el control de lo que se reproduce en la
        página.
      </p>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Formulario de creación */}
        <form
          onSubmit={handleSubmit}
          className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 h-fit"
        >
          {/* Selección de playlist */}
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Selecciona una playlist
            </label>
            <select
              value={playlistId}
              onChange={(e) => setPlaylistId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded mt-1 focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="" disabled>
                -- Selecciona una opción --
              </option>
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.title}
                </option>
              ))}
            </select>
          </div>

          {/* Ingreso de Fechas/Horarios */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Horario (Ciudad de México)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400">
                  Hora de inicio
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded mt-1 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400">
                  Hora de fin
                </label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded mt-1 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Sección de botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium p-2.5 rounded text-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Guardando..." : "Guardar horario"}
            </button>

            <button
              type="button"
              onClick={cleanFields}
              disabled={isSubmitting}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium p-2.5 rounded text-sm transition-colors border border-slate-700 disabled:opacity-50"
            >
              Limpiar
            </button>
          </div>
        </form>

        {/* Lista/Panel lateral de Horarios existentes */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Horarios Programados
          </h2>
          {slots.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No hay horarios programados actualmente.
            </p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-lg text-xs space-y-1"
                >
                  {/* Cabecera */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-blue-400">
                      {slot.playlist_title || "Playlist sin título"}
                    </p>
                    {/*Botones */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleDelete(slot)}
                        disabled={deletingId === slot.id}
                        aria-label="Cancelar horario"
                        className="text-slate-500 hover:text-red-400 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-300">
                    <span className="text-slate-400">Inicio:</span>{" "}
                    {dateFormatter.format(new Date(slot.starts_at))}
                  </p>
                  <p className="text-slate-300">
                    <span className="text-slate-400">Fin:</span>{" "}
                    {dateFormatter.format(new Date(slot.ends_at))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
