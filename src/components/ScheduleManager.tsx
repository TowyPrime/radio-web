"use client";

import { Playlist } from "@/services/audioService/types";
import { useCallback, useEffect, useState } from "react";
import { notify } from "./toast";
import { AppError } from "@/data/AppError";
import { Slot } from "@/lib/schedule/types";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { STATION_TIME_ZONE } from "@/lib/schedule/constants";
import { useRouter } from "next/navigation";

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

  const router = useRouter();

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
      router.refresh();
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
      router.refresh();
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
      <p className="text-ink-400 text-sm mb-6">
        Crea un horario para llevar el control de lo que se reproduce en la
        página.
      </p>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Formulario de creación */}
        <form
          onSubmit={handleSubmit}
          className="md:col-span-3 bg-ink-900 border border-ink-800 rounded-2xl p-6 space-y-4 h-fit"
        >
          {/* Selección de playlist */}
          <div>
            <Label htmlFor="schedule-playlist" className="text-ink-300">
              Selecciona una playlist
            </Label>
            <Select
              id="schedule-playlist"
              value={playlistId}
              onChange={(e) => setPlaylistId(e.target.value)}
              className="mt-1"
            >
              <option value="" disabled>
                -- Selecciona una opción --
              </option>
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.title}
                </option>
              ))}
            </Select>
          </div>

          {/* Ingreso de Fechas/Horarios */}
          <div>
            <label className="block text-sm font-medium text-ink-300 mb-2">
              Horario (Ciudad de México)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schedule-start" className="text-xs text-ink-400">
                  Hora de inicio
                </Label>
                <Input
                  id="schedule-start"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="schedule-end" className="text-xs text-ink-400">
                  Hora de fin
                </Label>
                <Input
                  id="schedule-end"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Sección de botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              size="md"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Guardando..." : "Guardar horario"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={cleanFields}
              disabled={isSubmitting}
              className="flex-1"
            >
              Limpiar
            </Button>
          </div>
        </form>

        {/* Lista/Panel lateral de Horarios existentes */}
        <div className="md:col-span-2 bg-ink-900 border border-ink-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Horarios Programados
          </h2>
          {slots.length === 0 ? (
            <p className="text-ink-500 text-sm">
              No hay horarios programados actualmente.
            </p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-ink-800/60 border border-ink-700/50 p-3 rounded-lg text-xs space-y-1"
                >
                  {/* Cabecera */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-brand-400">
                      {slot.playlist_title || "Playlist sin título"}
                    </p>
                    {/*Botones */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(slot)}
                        disabled={deletingId === slot.id}
                        aria-label="Cancelar horario"
                        className="text-ink-500 hover:bg-transparent hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-ink-300">
                    <span className="text-ink-400">Inicio:</span>{" "}
                    {dateFormatter.format(new Date(slot.starts_at))}
                  </p>
                  <p className="text-ink-300">
                    <span className="text-ink-400">Fin:</span>{" "}
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
