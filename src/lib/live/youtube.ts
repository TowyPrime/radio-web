import type { LiveStatus } from "./types";

const CHANNEL_ID_REGEX = /^UC[\w-]{22}$/;
const VIDEO_ID_REGEX = /^[\w-]{11}$/;

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
// Cuántas subidas recientes del canal se revisan para encontrar un directo activo
const RECENT_UPLOADS_TO_CHECK = 10;
// El resultado se reutiliza este tiempo, sin importar cuántos visitantes pregunten.
// Cada consulta gasta 2 unidades de la cuota diaria (10 000) de la API de YouTube.
const LIVE_STATUS_TTL_MS = 30_000;
// Si YouTube falla, se reintenta pronto en lugar de esperar todo el TTL
const LIVE_STATUS_ERROR_TTL_MS = 10_000;

const NOT_CONFIGURED: LiveStatus = {
  configured: false,
  isLive: false,
  videoId: null,
  title: null,
};

function getChannelId(): string | null {
  const channelId = process.env.YOUTUBE_CHANNEL_ID?.trim();

  if (!channelId || !CHANNEL_ID_REGEX.test(channelId)) {
    console.error(
      `[YouTube Error]: El ID del canal de YouTube (YOUTUBE_CHANNEL_ID) no está definido o no es válido. Debe comenzar con "UC" y tener 24 caracteres en total.`,
    );
    return null;
  }

  return channelId;
}

export function getYoutubeEmbedUrl(): string | null {
  const channelId = getChannelId();
  if (!channelId) return null;

  return `https://www.youtube.com/embed/live_stream?channel=${channelId}`;
}

interface PlaylistItemsResponse {
  items?: { contentDetails?: { videoId?: string } }[];
}

interface VideosResponse {
  items?: {
    id?: string;
    snippet?: { title?: string; liveBroadcastContent?: string };
  }[];
}

async function fetchYoutubeJson<T>(
  path: string,
  params: Record<string, string>,
  apiKey: string,
): Promise<T> {
  const query = new URLSearchParams({ ...params, key: apiKey });
  const response = await fetch(`${YOUTUBE_API_BASE}/${path}?${query}`, {
    cache: "no-store",
  });

  // Solo se informa el estado: la URL lleva la llave de la API y no debe quedar en los logs
  if (!response.ok) {
    throw new Error(`La API de YouTube respondió ${response.status} en ${path}`);
  }

  return (await response.json()) as T;
}

let cachedStatus: { expiresAt: number; status: LiveStatus } | null = null;

// Pregunta a YouTube si el canal tiene un directo activo ahora mismo.
// Usa la lista de subidas del canal (su ID es el del canal con "UU" en lugar de "UC") y
// revisa cuál de los videos recientes tiene `liveBroadcastContent === "live"`.
// Las transmisiones en vivo aparecen ahí en cuanto empiezan.
export async function getLiveStatus(): Promise<LiveStatus> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  const channelId = getChannelId();

  if (!apiKey || !channelId) return NOT_CONFIGURED;

  if (cachedStatus && Date.now() < cachedStatus.expiresAt) {
    return cachedStatus.status;
  }

  try {
    const uploads = await fetchYoutubeJson<PlaylistItemsResponse>(
      "playlistItems",
      {
        part: "contentDetails",
        playlistId: `UU${channelId.slice(2)}`,
        maxResults: String(RECENT_UPLOADS_TO_CHECK),
      },
      apiKey,
    );

    const videoIds = (uploads.items ?? [])
      .map((item) => item.contentDetails?.videoId)
      .filter((id): id is string => !!id && VIDEO_ID_REGEX.test(id));

    let status: LiveStatus = {
      configured: true,
      isLive: false,
      videoId: null,
      title: null,
    };

    if (videoIds.length > 0) {
      const videos = await fetchYoutubeJson<VideosResponse>(
        "videos",
        { part: "snippet", id: videoIds.join(",") },
        apiKey,
      );

      const liveVideo = (videos.items ?? []).find(
        (video) =>
          video.snippet?.liveBroadcastContent === "live" &&
          !!video.id &&
          VIDEO_ID_REGEX.test(video.id),
      );

      if (liveVideo?.id) {
        status = {
          configured: true,
          isLive: true,
          videoId: liveVideo.id,
          title: liveVideo.snippet?.title ?? null,
        };
      }
    }

    cachedStatus = { expiresAt: Date.now() + LIVE_STATUS_TTL_MS, status };
    return status;
  } catch (error) {
    console.error("[YouTube Error]: No se pudo consultar el estado del directo:", error);

    // Con un valor anterior se sigue usando (mejor un dato un poco viejo que ninguno)
    const fallback: LiveStatus = cachedStatus?.status ?? {
      configured: true,
      isLive: false,
      videoId: null,
      title: null,
    };
    cachedStatus = {
      expiresAt: Date.now() + LIVE_STATUS_ERROR_TTL_MS,
      status: fallback,
    };
    return fallback;
  }
}
