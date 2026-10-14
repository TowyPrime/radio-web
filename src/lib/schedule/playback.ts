import { BroadcastTrack } from "@/services/audioService/types";


export interface PlaybackPosition{
    index: number;
    offsetSeconds: number;
}

export function getPlaybackPosition(
    tracks: BroadcastTrack[] ,
    elapsedSeconds: number,
): PlaybackPosition | null {
    if(elapsedSeconds < 0) return null;

    let accumulated = 0;

    for(let index = 0; index < tracks.length; index++){
        const end = accumulated + tracks[index].duration;

        if(elapsedSeconds < end){
            return {index, offsetSeconds: elapsedSeconds - accumulated}
        }

        accumulated = end;
    }
    return null;
}