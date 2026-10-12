"use client";

import { useState, useEffect } from "react";
import { notify } from "./toast";
import { AppError } from "@/data/AppError";
import { Playlist, TrackRecord } from "@/services/audioService/types";
import { Check, ListMusic } from "lucide-react";
import { convertSecondsInMinutes } from "@/lib/tracks/functions";
import { MAX_TRACKS_PER_PLAYLIST } from "@/lib/tracks/constants";

interface PlaylistManagerProps {
  initialTracks: TrackRecord[];
}

export default function PlaylistManager({
  initialTracks,
}: PlaylistManagerProps) {
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await fetch("/api/admin/playlists");

        if (!response.ok) {
          notify.error("Ocurrió un error en la consulta de playlists");
          return;
        }

        const data: { playlists: Playlist[] } = await response.json();
        setPlaylists(data.playlists);
      } catch (error) {
        console.error("Ocurrió un error en la consulta de playlists:", error);
        notify.error("Ocurrió un error indefinido en la consulta");
      }
    };

    fetchPlaylists();
  }, []);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      notify.error("El campo nombre no puede ir vacío");
      return;
    }

    if(selected.size > MAX_TRACKS_PER_PLAYLIST){
      notify.error(`Una playlist admite un maximo de ${MAX_TRACKS_PER_PLAYLIST} canciones`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle }),
      });

      const dataPlaylist = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new AppError(
            dataPlaylist?.error ||
              "La playlist ya existe, intenta con otro nombre",
          );
        }

        throw new AppError(
          dataPlaylist?.error || "Ocurrió un error al crear playlist",
        );
      }

      // La API responde { playlist: { id } }
      const playlistId: string | undefined = dataPlaylist?.playlist?.id;

      if (!playlistId) {
        throw new AppError("No se recibió el id de la playlist creada");
      }

      // Agregamos las canciones una por una (así quedan en el orden elegido).
      // Si una falla, la playlist ya existe: la mostramos con las que sí entraron.
      let addedCount = 0;
      let trackError: string | null = null;

      for (const trackId of selected) {
        const trackResponse = await fetch(`/api/admin/playlists/${playlistId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ track_id: trackId }),
        });

        if (!trackResponse.ok) {
          const trackErrorData = await trackResponse.json().catch(() => null);
          trackError =
            trackErrorData?.error ||
            "La playlist se creó, pero falló al agregar una canción";
          break;
        }

        addedCount++;
      }

      setPlaylists((prevPlaylists) => [
        { id: playlistId, title: trimmedTitle, track_count: addedCount },
        ...prevPlaylists,
      ]);
      setTitle("");
      setSelected(new Set());

      if (trackError) {
        notify.error(trackError);
      } else {
        notify.success("Playlist creada con éxito");
      }
    } catch (error: unknown) {
      console.error("Error inesperado en la consulta:", error);
      const errorMessage =
        error instanceof AppError ? error.message : "Ocurrió un error inesperado";
      notify.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Crear playlist</h1>
      <p className="text-slate-400 text-sm mb-6">
        Arma una lista con la música de la biblioteca para reproducirla al aire.
      </p>

      <div className="grid gap-6 md:grid-cols-5">
        <form
          onSubmit={handleSubmit}
          className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre de la playlist"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />

          <ul className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
            {initialTracks.map((t) => {
              const isOn = selected.has(t.id);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => toggle(t.id)}
                    className="w-full flex items-center gap-3 py-3 text-left cursor-pointer hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                  >
                    <span
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                        isOn
                          ? "bg-blue-600 border-blue-600"
                          : "border-slate-600"
                      }`}
                    >
                      {isOn && <Check className="w-3.5 h-3.5 text-white" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-white truncate">
                        {t.title}
                      </span>
                      <span className="block text-xs text-slate-500 truncate">
                        {t.artist}
                      </span>
                    </span>
                    <span className="text-xs text-slate-500">
                      {convertSecondsInMinutes(t.duration)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            {isSubmitting
              ? "Creando..."
              : `Crear playlist (${selected.size} canciones)`}
          </button>
        </form>

        <section className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
          <h2 className="font-semibold text-white mb-4">Mis playlists</h2>
          <ul className="space-y-3">
            {playlists.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center">
                  <ListMusic className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white">{p.title}</p>
                  <p className="text-xs text-slate-500">
                    {p.track_count} canciones
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
