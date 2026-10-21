"use client";

import { useState, useEffect } from "react";
import { notify } from "./toast";
import { AppError } from "@/data/AppError";
import {
  Playlist,
  TrackRecord,
  PlaylistTrack,
} from "@/services/audioService/types";
import {
  Check,
  ListMusic,
  ChevronDown,
  ChevronUp,
  Trash2,
  Pencil,
  Plus,
} from "lucide-react";
import { convertSecondsInMinutes } from "@/lib/tracks/functions";
import { MAX_TRACKS_PER_PLAYLIST } from "@/lib/tracks/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Botones de solo icono de las listas (subir, bajar, quitar...): discretos hasta el hover
const ICON_BUTTON_CLASSES =
  "text-ink-500 hover:bg-transparent hover:text-white disabled:opacity-30";

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
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null,
  );
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isUpdatingTracks, setIsUpdatingTracks] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isUpdatingPlaylist, setIsUpdatingPlaylist] = useState(false);

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

  const handleSelectPlaylist = async (id: string) => {
    setSelectedPlaylistId(id);
    setIsEditingTitle(false);
    setPlaylistTracks([]);
    setIsLoadingTracks(true);

    try {
      const response = await fetch(`/api/admin/playlists/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new AppError(
          data?.error || "No se pudieron cargar las canciones de la playlist",
        );
      }

      setPlaylistTracks(data.tracks);
    } catch (error: unknown) {
      console.error("Error al cargar las canciones de la playlist:", error);
      notify.error(
        error instanceof AppError
          ? error.message
          : "Ocurrió un error inesperado",
      );
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!selectedPlaylistId || isUpdatingTracks) return;

    setIsUpdatingTracks(true);

    try {
      const response = await fetch(
        `/api/admin/playlists/${selectedPlaylistId}/tracks/${trackId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new AppError(data?.error || "No se pudo quitar la canción");
      }

      setPlaylistTracks((prev) => prev.filter((t) => t.track_id !== trackId));
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === selectedPlaylistId
            ? { ...p, track_count: p.track_count - 1 }
            : p,
        ),
      );

      notify.success("Canción quitada de playlist");
    } catch (error: unknown) {
      console.error("Error al quitar la canción:", error);
      notify.error(
        error instanceof AppError
          ? error.message
          : "Ocurrió un error inesperado",
      );
    } finally {
      setIsUpdatingTracks(false);
    }
  };

  const handleMoveTrack = async (index: number, direction: -1 | 1) => {
    if (!selectedPlaylistId || isUpdatingTracks) return;

    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= playlistTracks.length) return;

    const reordered = [...playlistTracks];
    [reordered[index], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[index],
    ];

    setIsUpdatingTracks(true);

    try {
      const response = await fetch(
        `/api/admin/playlists/${selectedPlaylistId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ track_ids: reordered.map((t) => t.track_id) }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new AppError(data?.error || "No se pudo cambiar el orden");
      }

      setPlaylistTracks(reordered);
    } catch (error: unknown) {
      console.error("Error al reordenar la playlist:", error);
      notify.error(
        error instanceof AppError
          ? error.message
          : "Ocurrió un error inesperado",
      );
    } finally {
      setIsUpdatingTracks(false);
    }
  };

  const handleAddTrack = async (track: TrackRecord) => {
  if (!selectedPlaylistId || isUpdatingTracks) return;

  if (playlistTracks.length >= MAX_TRACKS_PER_PLAYLIST) {
    notify.error(
      `Una playlist admite como máximo ${MAX_TRACKS_PER_PLAYLIST} canciones`,
    );
    return;
  }

  setIsUpdatingTracks(true);

  try {
    const response = await fetch(`/api/admin/playlists/${selectedPlaylistId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track_id: track.id }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new AppError(data?.error || "No se pudo agregar la canción");
    }

    setPlaylistTracks((prev) => [
      ...prev,
      {
        position: data.track.position,
        track_id: track.id,
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        url: track.url,
      },
    ]);
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === selectedPlaylistId
          ? { ...p, track_count: p.track_count + 1 }
          : p,
      ),
    );
    notify.success("Canción agregada a la playlist");
  } catch (error: unknown) {
    console.error("Error al agregar la canción:", error);
    notify.error(
      error instanceof AppError ? error.message : "Ocurrió un error inesperado",
    );
  } finally {
    setIsUpdatingTracks(false);
  }
};

  const handleStartRename = () => {
    const current = playlists.find((p) => p.id === selectedPlaylistId);

    if (!current) return;

    setEditedTitle(current.title);
    setIsEditingTitle(true);
  };

  const handleRenamePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlaylistId || isUpdatingPlaylist) return;

    const trimmedTitle = editedTitle.trim();

    if (!trimmedTitle) {
      notify.error("El nombre no puede ir vacío");
      return;
    }

    if (trimmedTitle.length > 50) {
      notify.error("El nombre admite como máximo 50 caracteres");
      return;
    }

    setIsUpdatingPlaylist(true);

    try {
      const response = await fetch(
        `/api/admin/playlists/${selectedPlaylistId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new AppError(data?.error || "No se pudo renombrar la playlist");
      }

      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === selectedPlaylistId
            ? { ...p, title: data.playlist.title }
            : p,
        ),
      );
      setIsEditingTitle(false);
      notify.success("Playlist renombrada");
    } catch (error: unknown) {
      console.error("Error al renombrar la playlist:", error);
      notify.error(
        error instanceof AppError
          ? error.message
          : "Ocurrió un error inesperado",
      );
    } finally {
      setIsUpdatingPlaylist(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!selectedPlaylistId || isUpdatingPlaylist) return;

    const current = playlists.find((p) => p.id === selectedPlaylistId);

    const confirmed = window.confirm(
      `¿Seguro que quieres borrar la playlist "${current?.title}"? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    setIsUpdatingPlaylist(true);

    try {
      const response = await fetch(
        `/api/admin/playlists/${selectedPlaylistId}`,
        {
          method: "DELETE",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new AppError(data?.error || "No se pudo borrar la playlist");
      }

      setPlaylists((prev) => prev.filter((p) => p.id !== selectedPlaylistId));
      setSelectedPlaylistId(null);
      setPlaylistTracks([]);
      setIsEditingTitle(false);
      notify.success("Playlist eliminada");
    } catch (error: unknown) {
      console.error("Error al borrar la playlist:", error);
      notify.error(
        error instanceof AppError
          ? error.message
          : "Ocurrió un error inesperado",
      );
    } finally {
      setIsUpdatingPlaylist(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      notify.error("El campo nombre no puede ir vacío");
      return;
    }

    if (selected.size > MAX_TRACKS_PER_PLAYLIST) {
      notify.error(
        `Una playlist admite un maximo de ${MAX_TRACKS_PER_PLAYLIST} canciones`,
      );
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
        const trackResponse = await fetch(
          `/api/admin/playlists/${playlistId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ track_id: trackId }),
          },
        );

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
        error instanceof AppError
          ? error.message
          : "Ocurrió un error inesperado";
      notify.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableTracks = initialTracks.filter(
  (t) => !playlistTracks.some((pt) => pt.track_id === t.id),
);

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Crear playlist</h1>
      <p className="text-ink-400 text-sm mb-6">
        Arma una lista con la música de la biblioteca para reproducirla al aire.
      </p>

      <div className="grid gap-6 md:grid-cols-5">
        <form
          onSubmit={handleSubmit}
          className="md:col-span-3 bg-ink-900 border border-ink-800 rounded-2xl p-6 space-y-4"
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre de la playlist"
            aria-label="Nombre de la playlist"
          />

          <ul className="divide-y divide-ink-800 max-h-96 overflow-y-auto">
            {initialTracks.map((t) => {
              const isOn = selected.has(t.id);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => toggle(t.id)}
                    className="w-full flex items-center gap-3 py-3 text-left cursor-pointer hover:bg-ink-800/40 px-2 rounded-lg transition-colors"
                  >
                    <span
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                        isOn
                          ? "bg-brand-700 border-brand-500"
                          : "border-ink-600"
                      }`}
                    >
                      {isOn && <Check className="w-3.5 h-3.5 text-white" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-white truncate">
                        {t.title}
                      </span>
                      <span className="block text-xs text-ink-500 truncate">
                        {t.artist}
                      </span>
                    </span>
                    <span className="text-xs text-ink-500">
                      {convertSecondsInMinutes(t.duration)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <Button
            type="submit"
            size="md"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting
              ? "Creando..."
              : `Crear playlist (${selected.size} canciones)`}
          </Button>
        </form>

        <section className="md:col-span-2 bg-ink-900 border border-ink-800 rounded-2xl p-6 h-fit">
          <h2 className="font-semibold text-white mb-4">Mis playlists</h2>
          <ul className="space-y-3">
            {playlists.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => handleSelectPlaylist(p.id)}
                  className={`w-full flex items-center gap-3 text-left cursor-pointer rounded-lg p-2 transition-colors hover:bg-ink-800/40 ${
                    selectedPlaylistId === p.id ? "bg-ink-800/60" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center">
                    <ListMusic className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white">{p.title}</p>
                    <p className="text-xs text-ink-500">
                      {p.track_count} canciones
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
      {selectedPlaylistId && (
        <section className="mt-6 bg-ink-900 border border-ink-800 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            {isEditingTitle ? (
              <form
                onSubmit={handleRenamePlaylist}
                className="flex flex-1 items-center gap-2"
              >
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  aria-label="Nuevo nombre de la playlist"
                  className="flex-1"
                />
                <Button type="submit" disabled={isUpdatingPlaylist}>
                  Guardar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditingTitle(false)}
                >
                  Cancelar
                </Button>
              </form>
            ) : (
              <>
                <h2 className="font-semibold text-white truncate">
                  {playlists.find((p) => p.id === selectedPlaylistId)?.title}
                </h2>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleStartRename}
                    disabled={isUpdatingPlaylist}
                    aria-label="Renombrar playlist"
                    className={ICON_BUTTON_CLASSES}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleDeletePlaylist}
                    disabled={isUpdatingPlaylist}
                    aria-label="Borrar playlist"
                    className={`${ICON_BUTTON_CLASSES} hover:text-red-400`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {isLoadingTracks ? (
            <p className="text-sm text-ink-400">Cargando canciones...</p>
          ) : playlistTracks.length === 0 ? (
            <p className="text-sm text-ink-400">
              Esta playlist aún no tiene canciones.
            </p>
          ) : (
            <ol className="divide-y divide-ink-800">
              {playlistTracks.map((t, index) => (
                <li key={t.track_id} className="flex items-center gap-3 py-3">
                  <span className="w-6 text-xs text-ink-500">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{t.title}</p>
                    <p className="text-xs text-ink-500 truncate">
                      {t.artist}
                    </p>
                  </div>
                  <span className="text-xs text-ink-500">
                    {convertSecondsInMinutes(t.duration)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleMoveTrack(index, -1)}
                      disabled={isUpdatingTracks || index === 0}
                      aria-label={`Subir ${t.title}`}
                      className={ICON_BUTTON_CLASSES}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleMoveTrack(index, 1)}
                      disabled={
                        isUpdatingTracks || index === playlistTracks.length - 1
                      }
                      aria-label={`Bajar ${t.title}`}
                      className={ICON_BUTTON_CLASSES}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveTrack(t.track_id)}
                      disabled={isUpdatingTracks}
                      aria-label={`Quitar ${t.title}`}
                      className={`${ICON_BUTTON_CLASSES} hover:text-red-400`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {!isLoadingTracks && (
  <div className="mt-6 pt-6 border-t border-ink-800">
    <h3 className="text-sm font-semibold text-ink-300 mb-3">
      Agregar canciones
    </h3>

    {availableTracks.length === 0 ? (
      <p className="text-sm text-ink-400">
        No hay más canciones de la biblioteca para agregar.
      </p>
    ) : (
      <ul className="divide-y divide-ink-800 max-h-64 overflow-y-auto">
        {availableTracks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{t.title}</p>
              <p className="text-xs text-ink-500 truncate">{t.artist}</p>
            </div>
            <span className="text-xs text-ink-500">
              {convertSecondsInMinutes(t.duration)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => handleAddTrack(t)}
              disabled={isUpdatingTracks}
              aria-label={`Agregar ${t.title}`}
              className={`${ICON_BUTTON_CLASSES} hover:text-brand-400`}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </li>
        ))}
      </ul>
    )}
  </div>
)}
        </section>
      )}
    </main>
  );
}
