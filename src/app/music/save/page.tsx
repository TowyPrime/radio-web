import { TrackRecord } from "@/services/audioService/types";
import MusicManager from "@/components/MusicManager";
import { getTracks } from "@/services/audioService/tracks";

export default async function SaveMusicPage() {
  let tracks: TrackRecord[] = [];
  let errorMessage: string | null = null;

  try {
    tracks = await getTracks();
  } catch (error: unknown) {
    console.error("Ocurrió un error al intentar obtener canciones:", error);
    errorMessage =
      "No se pudieron cargar las canciones en este momento. Intenta recargar la página.";
  }

  return (
    <div>
      <MusicManager initialTracks={tracks} />
      {errorMessage && (
        <div className="w-full max-w-md flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-red-200 shadow-lg backdrop-blur-sm animate-fade-in">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-red-400 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm font-medium text-center flex-1">
            {errorMessage}
          </p>
        </div>
      )}
    </div>
  );
}
