"use client";

import React, { useEffect, useState } from "react";
import {
  GripVertical,
  Maximize2,
  Minimize2,
  Music,
  Pause,
  Play,
} from "lucide-react";
import { useAudio } from "../context/AudioContext";
import { useDraggablePosition } from "@/hooks/useDraggablePosition";
import { STATION_TIME_ZONE } from "@/lib/schedule/constants";

function formatNext(startsAt: string): string {
  return new Date(startsAt).toLocaleString("es-MX", {
    timeZone: STATION_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EQUALIZER_DELAYS_SECONDS = [0, 0.25, 0.5];
const PLAYER_POSITION_STORAGE_KEY = "radio-player-position";
const PLAYER_MINIMIZED_STORAGE_KEY = "radio-player-minimized";
// Navbar (h-20 = 80px) más un pequeño margen
const PLAYER_MIN_TOP_PX = 88;

export default function GlobalPlayer() {
  const {
    isPlaying,
    status,
    programTitle,
    currentTrack,
    nextProgram,
    togglePlay,
  } = useAudio();

  const { elementRef, position, isDragging, handleProps } =
    useDraggablePosition<HTMLDivElement>({
      storageKey: PLAYER_POSITION_STORAGE_KEY,
      minTopPx: PLAYER_MIN_TOP_PX,
    });

  const [isMinimized, setIsMinimized] = useState(false);

  // Se recuerda si el usuario lo dejó minimizado (el primer dibujo siempre es el expandido,
  // igual en servidor y cliente, y luego se aplica lo guardado)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (window.localStorage.getItem(PLAYER_MINIMIZED_STORAGE_KEY) === "1") {
          setIsMinimized(true);
        }
      } catch {
        // Sin almacenamiento disponible: se queda expandido
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const toggleMinimized = () => {
    const next = !isMinimized;
    setIsMinimized(next);

    try {
      window.localStorage.setItem(PLAYER_MINIMIZED_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Solo no se recuerda la preferencia
    }
  };

  const canPlay = status === "on-air";

  let label = "Conectando...";
  let title = "";
  let subtitle = "";

  if (status === "on-air") {
    label = `En el aire · ${programTitle ?? ""}`;
    title = currentTrack?.title ?? "Pulsa play para escuchar";
    subtitle = currentTrack?.artist ?? "";
  } else if (status === "off-air") {
    label = "Sin transmisión";
    title = "No hay transmisión en este momento";
    subtitle = nextProgram
      ? `Próximo: ${nextProgram.playlist_title} · ${formatNext(nextProgram.starts_at)}`
      : "";
  }

  // Expandido, móvil: fijo abajo y a lo ancho. Escritorio: tarjeta angosta arriba a la
  // derecha, bajo el Navbar, que el usuario puede arrastrar (su posición se recuerda).
  // Minimizado: cápsula compacta pegada a la derecha (en móvil, abajo).
  const sizeClasses = isMinimized ? "right-4" : "left-4 right-4 sm:w-96";

  return (
    <div
      ref={elementRef}
      style={
        position
          ? { left: position.x, top: position.y, right: "auto", bottom: "auto" }
          : undefined
      }
      title={isMinimized ? [title, subtitle].filter(Boolean).join(" · ") : undefined}
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex items-center justify-between gap-3 rounded-2xl border bg-ink-900/80 px-3 py-2.5 text-white shadow-2xl backdrop-blur sm:bottom-auto sm:left-auto sm:right-4 sm:top-24 ${sizeClasses} ${
        isDragging ? "select-none border-brand-400/50" : "border-ink-700/60"
      }`}
    >
      <button
        type="button"
        {...handleProps}
        aria-label="Mover reproductor (flechas del teclado; doble clic para restablecer)"
        title="Arrastra para mover · doble clic para restablecer"
        className={`-ml-1 hidden h-11 w-5 shrink-0 touch-none items-center justify-center rounded text-ink-500 hover:text-ink-300 focus-visible:outline-2 focus-visible:outline-brand-400 sm:flex ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      <div
        className={`flex min-w-0 items-center gap-3 ${isMinimized ? "" : "flex-1"}`}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-brand-400">
          {isPlaying ? (
            <div className="flex h-5 items-end gap-0.5" aria-hidden="true">
              {EQUALIZER_DELAYS_SECONDS.map((delay) => (
                <span
                  key={delay}
                  className="eq-bar"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          ) : (
            <Music className="h-5 w-5" aria-hidden="true" />
          )}
        </div>

        {!isMinimized && (
          <div className="min-w-0">
            <div
              className={`truncate text-[10px] font-semibold uppercase tracking-wider ${
                canPlay ? "text-brand-400" : "text-ink-500"
              }`}
            >
              {label}
            </div>
            <div className="truncate text-sm font-medium text-white">
              {title}
            </div>
            <div className="line-clamp-2 text-[11px] text-ink-400">
              {subtitle}
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={toggleMinimized}
          aria-label={
            isMinimized ? "Expandir reproductor" : "Minimizar reproductor"
          }
          aria-expanded={!isMinimized}
          title={isMinimized ? "Expandir" : "Minimizar"}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-800 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-400"
        >
          {isMinimized ? (
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Minimize2 className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        <button
          onClick={togglePlay}
          disabled={!canPlay}
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand-700 text-white shadow-md transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={isPlaying ? "Pausar" : "Reproducir"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" fill="currentColor" />
          ) : (
            <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
          )}
        </button>
      </div>
    </div>
  );
}
