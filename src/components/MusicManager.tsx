"use client";

import { useRef, useState } from "react";
import { Music, UploadCloud, Trash2 } from "lucide-react";
import { notify } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type TrackRecord } from "@/services/audioService/types";
import { createClient } from "@/utils/supabase/client";
import {
  ALLOWED_FILE_TYPES,
  BUCKET_NAME,
  MAX_DURATION_SECONDS,
} from "@/lib/tracks/constants";
import {
  getAudioDuration,
  convertSecondsInMinutes,
} from "@/lib/tracks/functions";
import { AppError } from "@/data/AppError";

interface MusicManagerProps {
  initialTracks: TrackRecord[];
}

export default function MusicManager({ initialTracks }: MusicManagerProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [tracks, setTracks] = useState<TrackRecord[]>(initialTracks);
  const [file, setFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedArtist = artist.trim();

    if (!file) {
      notify.error("Es necesario seleccionar un archivo para guardar.");
      return;
    }

    const fileType = file.type;

    if (!ALLOWED_FILE_TYPES.has(fileType)) {
      notify.error("El tipo de archivo no es el esperado.");
      return;
    }

    if (!trimmedTitle) {
      notify.error("El campo título es obligatorio, no puede quedar vacío");
      return;
    }

    if (!trimmedArtist) {
      notify.error("El campo artista es obligatorio, no puede quedar vacío");
      return;
    }

    if (trimmedTitle.length > 50) {
      notify.error("El titulo debe tener un máximo de 50 caracteres");
      return;
    }

    if (trimmedArtist.length > 50) {
      notify.error(
        "El nombre de artista debe tener un máximo de 50 caracteres",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const duration = await getAudioDuration(file);

      if (duration <= 0 || duration >= MAX_DURATION_SECONDS) {
        notify.error(
          `La duración del archivo de audio debe ser mayor a 0 y ${MAX_DURATION_SECONDS} segundos`,
        );
        return;
      }

      const uploadResponse = await fetch("/api/admin/tracks/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileType }),
      });

      const data = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new AppError(
          data.error || "No se pudo generar la URL de subida.",
        );
      }

      const { token, path } = data;

      const supabase = createClient();

      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .uploadToSignedUrl(path, token, file, {
          contentType: fileType,
        });

      if (storageError) {
        console.error("Detalle técnico de Supabase Storage:", storageError);
        throw new AppError(
          "Hubo un problema al subir el archivo al almacenamiento. Inténtalo de nuevo.",
        );
      }

      const response = await fetch("/api/admin/tracks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          artist: trimmedArtist,
          duration: duration,
          path: path,
        }),
      });

      const dataTrack = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new AppError(
            dataTrack?.error || "El archivo ya existe en la biblioteca.",
          );
        }
        throw new AppError(
          dataTrack?.error ||
            "Ocurrió un error al guardar la canción en la base de datos.",
        );
      }

      setTracks((prevTracks) => [dataTrack.track, ...prevTracks]);

      clean();
      notify.success("Archivo de música subido correctamente");
    } catch (error: unknown) {
      console.error("Error al enviar archivo de música:", error);

      const errorMessage =
        error instanceof AppError
          ? error.message
          : "Ocurrió un problema al procesar tu solicitud, inténtalo de nuevo más tarde.";

      notify.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clean = () => {
    setTitle("");
    setArtist("");
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "¿Está seguro de borrar este archivo de música? Esta es una acción irreversible",
    );
    if (!confirmed) return;

    setDeletingId(id);

    try {
      const response = await fetch("/api/admin/tracks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AppError(data.error || "No se pudo eliminar el track");
      }

      setTracks((prevTracks) => prevTracks.filter((track) => track.id !== id));

      notify.success("Se eliminó correctamente el archivo de música");
    } catch (error: unknown) {
      console.error("Error al eliminar el archivo de música:", error);
      const errorMessage =
        error instanceof AppError
          ? error.message
          : "Ocurrió un problema al procesar tu solicitud, inténtalo de nuevo más tarde.";
          
      notify.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Guardar música</h1>
      <p className="text-ink-400 text-sm mb-6">
        Sube canciones a la biblioteca de la emisora para usarlas en tus
        playlists.
      </p>

      <div className="grid gap-6 md:grid-cols-5">
        <form
          onSubmit={handleSubmit}
          className="md:col-span-2 bg-ink-900 border border-ink-800 rounded-2xl p-6 space-y-4 h-fit"
        >
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-ink-700 hover:border-brand-400 rounded-xl py-8 text-center cursor-pointer transition-colors">
            <UploadCloud className="w-8 h-8 text-brand-400" />
            <span className="text-sm text-ink-300">
              {file ? file.name : "Selecciona un archivo de audio"}
            </span>
            <span className="text-xs text-ink-500">MPEG, AAC, WAV u OGG</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0] ?? null;
                setFile(selectedFile);
              }}
            />
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            aria-label="Título"
          />
          <Input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artista"
            aria-label="Artista"
          />
          <Button
            type="submit"
            size="md"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Guardando..." : "Guardar canción"}
          </Button>
        </form>

        <section className="md:col-span-3 bg-ink-900 border border-ink-800 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4">
            Biblioteca ({tracks.length})
          </h2>
          <ul className="divide-y divide-ink-800">
            {tracks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-lg bg-ink-800 flex items-center justify-center shrink-0">
                  <Music className="w-4 h-4 text-brand-400" />
                </div>
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
                  onClick={() => handleDelete(t.id)}
                  disabled={deletingId === t.id}
                  className="text-ink-500 hover:bg-transparent hover:text-red-400"
                  aria-label={`Eliminar ${t.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
