import { Interface } from "readline";

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