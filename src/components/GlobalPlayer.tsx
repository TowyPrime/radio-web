'use client';

import React from 'react';
import { useAudio } from '../context/AudioContext';

export default function GlobalPlayer() {
  const { isPlaying, sourceType, currentTrack, togglePlay } = useAudio();

  return (
    <div className="w-full bg-blue-900 border-b border-slate-800 text-white px-6 py-2.5 flex items-center justify-between shadow-md  mb-2">
      {/* Información de la Canción / Emisora */}
      <div className="flex items-center space-x-3 overflow-hidden">
        <div className="relative w-10 h-10 bg-slate-800 rounded-md flex items-center justify-center shrink-0">
          {sourceType === 'live' ? (
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          ) : null}
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div className="truncate">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
            {sourceType === 'live' ? '🔴 En Vivo Ahora' : '🎵 Reproduciendo Playlist'}
          </div>
          <div className="text-xs font-medium truncate text-white">{currentTrack.title}</div>
          <div className="text-[10px] text-slate-400 truncate">{currentTrack.artist}</div>
        </div>
      </div>

      {/* Controles de Reproducción */}
      <div className="flex items-center space-x-4">
        <button
          onClick={togglePlay}
          className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full transition shadow-md flex items-center justify-center cursor-pointer"
          aria-label={isPlaying ? "Pausar" : "Reproducir"}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}