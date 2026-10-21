"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { KeyboardEvent, PointerEvent } from "react";

export interface Position {
  x: number;
  y: number;
}

interface UseDraggablePositionOptions {
  /** Clave de localStorage donde se recuerda la posición */
  storageKey: string;
  /** Distancia mínima desde el borde superior (para no quedar bajo el Navbar) */
  minTopPx: number;
  /** Separación mínima respecto a los bordes de la pantalla */
  edgeMarginPx?: number;
}

// Solo se puede arrastrar desde este ancho (el mismo breakpoint `sm` de Tailwind)
const DESKTOP_QUERY = "(min-width: 640px)";
const KEYBOARD_STEP_PX = 16;
const KEYBOARD_STEP_SHIFT_PX = 64;

function subscribeDesktop(onChange: () => void) {
  const mediaQuery = window.matchMedia(DESKTOP_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

const getDesktopSnapshot = () => window.matchMedia(DESKTOP_QUERY).matches;
// En el servidor no hay pantalla: se parte de "móvil" y el cliente corrige al hidratar
const getDesktopServerSnapshot = () => false;

function isPosition(value: unknown): value is Position {
  if (!value || typeof value !== "object") return false;
  const { x, y } = value as Record<string, unknown>;
  return (
    typeof x === "number" &&
    typeof y === "number" &&
    Number.isFinite(x) &&
    Number.isFinite(y)
  );
}

export function useDraggablePosition<T extends HTMLElement>({
  storageKey,
  minTopPx,
  edgeMarginPx = 8,
}: UseDraggablePositionOptions) {
  const elementRef = useRef<T | null>(null);
  // Dónde dentro del elemento agarró el usuario (null = no se está arrastrando)
  const dragOffsetRef = useRef<Position | null>(null);
  // Última posición calculada durante el arrastre (también sirve en pointercancel)
  const lastPositionRef = useRef<Position | null>(null);

  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getDesktopServerSnapshot,
  );

  // Recorta una posición para que el elemento quede dentro de la pantalla
  const clamp = useCallback(
    (pos: Position): Position => {
      const element = elementRef.current;
      const width = element?.offsetWidth ?? 0;
      const height = element?.offsetHeight ?? 0;

      const maxX = Math.max(window.innerWidth - width - edgeMarginPx, edgeMarginPx);
      const maxY = Math.max(window.innerHeight - height - edgeMarginPx, minTopPx);

      return {
        x: Math.min(Math.max(pos.x, edgeMarginPx), maxX),
        y: Math.min(Math.max(pos.y, minTopPx), maxY),
      };
    },
    [edgeMarginPx, minTopPx],
  );

  const persist = useCallback(
    (pos: Position | null) => {
      try {
        if (pos) {
          window.localStorage.setItem(storageKey, JSON.stringify(pos));
        } else {
          window.localStorage.removeItem(storageKey);
        }
      } catch {
        // Sin almacenamiento disponible (modo privado, bloqueado...): solo no se recuerda
      }
    },
    [storageKey],
  );

  // Al montar (y al pasar a pantalla ancha) se recupera la posición guardada
  useEffect(() => {
    if (!isDesktop) return;

    const timer = setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return;

        const parsed: unknown = JSON.parse(raw);
        if (isPosition(parsed)) setPosition(clamp(parsed));
      } catch {
        // Valor corrupto o sin acceso: se usa la posición por defecto
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isDesktop, storageKey, clamp]);

  // Si la ventana se reduce, se evita que el elemento quede fuera de la pantalla
  useEffect(() => {
    if (!isDesktop) return;

    const handleResize = () => {
      setPosition((prev) => (prev ? clamp(prev) : prev));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDesktop, clamp]);

  // Si el elemento cambia de tamaño (p. ej. al minimizarlo o expandirlo), se vuelve a
  // recortar la posición para que no quede fuera de la pantalla
  useEffect(() => {
    const element = elementRef.current;
    if (!isDesktop || !element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      setPosition((prev) => {
        if (!prev) return prev;
        const next = clamp(prev);
        return next.x === prev.x && next.y === prev.y ? prev : next;
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [isDesktop, clamp]);

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!isDesktop || event.button !== 0) return;

    const element = elementRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    // Se fija la posición actual para que al empezar no "salte" desde su sitio por defecto
    const startPosition = { x: rect.left, y: rect.top };
    lastPositionRef.current = startPosition;
    setPosition(startPosition);
    setIsDragging(true);

    // El asa sigue recibiendo el movimiento aunque el cursor salga de ella
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const offset = dragOffsetRef.current;
    if (!offset) return;

    const next = clamp({
      x: event.clientX - offset.x,
      y: event.clientY - offset.y,
    });

    lastPositionRef.current = next;
    setPosition(next);
  };

  const finishDrag = (event: PointerEvent<HTMLElement>) => {
    if (!dragOffsetRef.current) return;

    dragOffsetRef.current = null;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    persist(lastPositionRef.current);
  };

  const reset = () => {
    setPosition(null);
    persist(null);
  };

  // Mover con el teclado (flechas; con Mayús, pasos más grandes)
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!isDesktop) return;

    const step = event.shiftKey ? KEYBOARD_STEP_SHIFT_PX : KEYBOARD_STEP_PX;
    const moves: Record<string, Position> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };

    const move = moves[event.key];
    const element = elementRef.current;
    if (!move || !element) return;

    event.preventDefault();

    const rect = element.getBoundingClientRect();
    const next = clamp({ x: rect.left + move.x, y: rect.top + move.y });

    setPosition(next);
    persist(next);
  };

  return {
    elementRef,
    // En móvil se ignora cualquier posición guardada: el reproductor va fijo abajo
    position: isDesktop ? position : null,
    isDragging,
    isDesktop,
    handleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: finishDrag,
      onPointerCancel: finishDrag,
      onDoubleClick: reset,
      onKeyDown: handleKeyDown,
    },
  };
}
