// Estado del directo del canal de YouTube.
// `configured: false` significa que falta YOUTUBE_API_KEY o YOUTUBE_CHANNEL_ID: no se puede
// saber si hay directo y la página usa el reproductor de respaldo.
export interface LiveStatus {
  configured: boolean;
  isLive: boolean;
  videoId: string | null;
  title: string | null;
}
