

export interface TrackRecord{
    id: string ;
  title: string;
  artist: string;
  duration: number;
  url: string;
  path: string;
  created_at?: string;
}

export interface PlaylistRecord{
  id: string;
  title:string;
  created_at?: string;
  playlist_tracks?: { count: number }[] | null;
}
export interface Playlist{
  id:string;
  title:string;
  created_at?:string;
  track_count: number;
}

export interface PlaylistTrackRow{
 position: number;
 track_id: string;
 tracks: {
 title: string;
 artist: string;
 duration: number;
 url: string;
 } 
};

export interface PlaylistTrack {
  position: number;
  track_id:string;
  title:string;
  artist: string;
  duration:number;
  url: string;
}

export interface BroadcastTrack{
  title:string;
  artist: string;
  duration: number;
  url: string;
}

export interface BroadcastCurrent{
  slot_id: string;
  playlist_title: string;
  starts_at: string
  ends_at: string;
  tracks: BroadcastTrack[];
}

export interface BroadcastNext{
  playlist_title: string;
  starts_at: string;
}

export interface BroadcastState{
  serverTime: string;
  current:BroadcastCurrent | null;
  next: BroadcastNext | null; 
}