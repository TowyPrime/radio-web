export function getYoutubeEmbedUrl(): string | null {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  const youtubeChannelRegex = /^UC[\w-]{22}$/;

  if (!channelId || !youtubeChannelRegex.test(channelId)) {
    console.error(
      `[YouTube Error]: El ID del canal de YouTube (YOUTUBE_CHANNEL_ID) no está definido o no es válido. Valor actual: "${channelId}". Debe comenzar con "UC" y tener 24 caracteres en total.`,
    );
    return null;
  }
  return `https://www.youtube.com/embed/live_stream?channel=${channelId}`;
}
