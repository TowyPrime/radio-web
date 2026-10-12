import PlaylistManager from "@/components/PlaylistManager";
import { TrackRecord } from "@/services/audioService/types";
import { getTracks } from "@/services/audioService/tracks";

export default async function CreatePlaylistPage() {
  let tracks: TrackRecord[] = [];
  let errorMessage: string | null = null;

  try {
    tracks = await getTracks();
  } catch (error) {
    console.error("Ocurrió un error al intentar obtener canciones:", error);
    errorMessage =
      "No se pudieron cargar las canciones en este momento. Intenta recargar la página.";
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      {errorMessage && (
        <p className="mb-4 text-sm text-red-400">{errorMessage}</p>
      )}
      <PlaylistManager initialTracks={tracks} />
    </div>
  );
}
