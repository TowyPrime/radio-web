'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  BroadcastCurrent,
  BroadcastNext,
  BroadcastState,
} from '@/services/audioService/types';
import { getPlaybackPosition } from '@/lib/schedule/playback';

type PlayerStatus = 'loading' | 'on-air' | 'off-air';

interface AudioContextType {
  isPlaying: boolean;
  status: PlayerStatus;
  programTitle: string | null;
  currentTrack: { title: string; artist: string } | null;
  nextProgram: BroadcastNext | null;
  togglePlay: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const REFRESH_INTERVAL_MS = 60_000;

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<PlayerStatus>('loading');
  const [programTitle, setProgramTitle] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<{
    title: string;
    artist: string;
  } | null>(null);
  const [nextProgram, setNextProgram] = useState<BroadcastNext | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const broadcastRef = useRef<BroadcastState | null>(null);
  const clockOffsetRef = useRef(0);
  const trackIndexRef = useRef(-1);
  const slotIdRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);

  const getPosition = useCallback((current: BroadcastCurrent) => {
    const elapsedSeconds =
      (Date.now() + clockOffsetRef.current - Date.parse(current.starts_at)) /
      1000;

    return getPlaybackPosition(current.tracks, elapsedSeconds);
  }, []);

  const goOffAir = useCallback(() => {
    audioRef.current?.pause();
    trackIndexRef.current = -1;
    slotIdRef.current = null;
    setStatus('off-air');
    setProgramTitle(null);
    setCurrentTrack(null);
  }, []);

  const playTrack = useCallback(
    (current: BroadcastCurrent, index: number, offsetSeconds: number) => {
      const audio = audioRef.current;
      const track = current.tracks[index];

      if (!audio || !track) return;

      trackIndexRef.current = index;
      slotIdRef.current = current.slot_id;
      setStatus('on-air');
      setProgramTitle(current.playlist_title);
      setCurrentTrack({ title: track.title, artist: track.artist });

      audio.src = track.url;
      audio.addEventListener(
        'loadedmetadata',
        () => {
          audio.currentTime = offsetSeconds;
        },
        { once: true },
      );
      audio.play().catch((err) => console.error('Error al reproducir audio:', err));
    },
    [],
  );

  const syncAndPlay = useCallback(() => {
    const current = broadcastRef.current?.current;

    if (!current) {
      goOffAir();
      return;
    }

    const position = getPosition(current);

    if (!position) {
      goOffAir();
      return;
    }

    playTrack(current, position.index, position.offsetSeconds);
  }, [getPosition, goOffAir, playTrack]);

  const advance = useCallback(() => {
    const current = broadcastRef.current?.current;
    const nextIndex = trackIndexRef.current + 1;

    if (!current || nextIndex >= current.tracks.length) {
      goOffAir();
      return;
    }

    playTrack(current, nextIndex, 0);
  }, [goOffAir, playTrack]);

  const fetchSchedule = useCallback(async () => {
    try {
      const response = await fetch('/api/schedule', { cache: 'no-store' });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: BroadcastState = await response.json();

      broadcastRef.current = data;
      clockOffsetRef.current = Date.parse(data.serverTime) - Date.now();
      setNextProgram(data.next);

      const current = data.current;
      const position = current ? getPosition(current) : null;

      if (!current || !position) {
        if (isPlayingRef.current) {
          goOffAir();
        } else {
          slotIdRef.current = null;
          setStatus('off-air');
          setProgramTitle(null);
          setCurrentTrack(null);
        }
        return;
      }

      if (isPlayingRef.current) {
        if (slotIdRef.current !== current.slot_id) syncAndPlay();
        return;
      }

      setStatus('on-air');
      setProgramTitle(current.playlist_title);
      setCurrentTrack(null);
    } catch (error) {
      console.error('Error al consultar la programación:', error);
      setStatus((prev) => (prev === 'loading' ? 'off-air' : prev));
    }
  }, [getPosition, goOffAir, syncAndPlay]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onPlay = () => {
      isPlayingRef.current = true;
      setIsPlaying(true);
    };
    const onStop = () => {
      isPlayingRef.current = false;
      setIsPlaying(false);
    };
    const onEnded = () => advance();

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onStop);
    audio.addEventListener('error', onStop);
    audio.addEventListener('ended', onEnded);

    const initialFetchId = setTimeout(fetchSchedule, 0);
const intervalId = setInterval(fetchSchedule, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      clearTimeout(initialFetchId);
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onStop);
      audio.removeEventListener('error', onStop);
      audio.removeEventListener('ended', onEnded);
      audio.removeAttribute('src');
      audioRef.current = null;
    };
  }, [advance, fetchSchedule]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) return;

    if (isPlayingRef.current) {
      audio.pause();
      return;
    }

    syncAndPlay();
    fetchSchedule();
  }, [fetchSchedule, syncAndPlay]);

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        status,
        programTitle,
        currentTrack,
        nextProgram,
        togglePlay,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio debe usarse dentro de un AudioProvider');
  return context;
};