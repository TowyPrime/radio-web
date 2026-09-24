
'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

type AudioSourceType = 'live' | 'playlist';

interface AudioContextType {
  isPlaying: boolean;
  sourceType: AudioSourceType;
  currentTrack: { title: string; artist: string };
  togglePlay: () => void;
  setSource: (type: AudioSourceType, streamUrl: string, trackInfo?: { title: string; artist: string }) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// URL de ejemplo para el stream en vivo
const LIVE_STREAM_URL = 'https://playerservices.streamtheworld.com/api/livestream-redirect/XHMA.mp3';

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sourceType, setSourceType] = useState<AudioSourceType>('live');
  const [currentTrack, setCurrentTrack] = useState({ title: 'Transmisión en Vivo', artist: 'Emisora Central' });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    // Mantiene isPlaying sincronizado con el elemento real (p. ej. si el stream falla o termina)
    const onPlay = () => setIsPlaying(true);
    const onStop = () => setIsPlaying(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onStop);
    audio.addEventListener('ended', onStop);
    audio.addEventListener('error', onStop);

    return () => {
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onStop);
      audio.removeEventListener('ended', onStop);
      audio.removeEventListener('error', onStop);
      audio.removeAttribute('src');
      audioRef.current = null;
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      return;
    }

    // Un directo no se "reanuda": se vuelve a conectar para oír lo que suena ahora
    // y no el audio viejo que quedó en el buffer.
    if (!audio.src || sourceType === 'live') {
      audio.src = LIVE_STREAM_URL;
    }

    audio.play().catch((err) => console.error('Error al reproducir audio:', err));
  };

  const setSource = (type: AudioSourceType, url: string, trackInfo = { title: 'Desconocido', artist: 'Desconocido' }) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = url;
    setSourceType(type);
    setCurrentTrack(trackInfo);

    audio.play().catch((err) => console.error('Error al cambiar fuente:', err));
  };

  return (
    <AudioContext.Provider value={{ isPlaying, sourceType, currentTrack, togglePlay, setSource }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio debe usarse dentro de un AudioProvider');
  return context;
};
