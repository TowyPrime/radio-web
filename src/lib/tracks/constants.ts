 export const ALLOWED_FILE_TYPES = new Map<string, string>([
    ["audio/mpeg", "mp3"],
    ["audio/wav", "wav"],
    ["audio/ogg", "ogg"],
    ["audio/aac", "aac"]
 ]);

 export const BUCKET_NAME = "tracks";

 export const MAX_DURATION_SECONDS = 1200;

 export const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  export const MAX_TRACKS_PER_PLAYLIST = 100;