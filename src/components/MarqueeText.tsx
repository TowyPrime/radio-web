"use client";

import { useEffect, useRef, useState } from "react";

interface MarqueeTextProps {
  text: string;
  className?: string;
}

// Velocidad de desplazamiento del texto, en píxeles por segundo
const PIXELS_PER_SECOND = 30;
// En cada ciclo el texto se queda quieto al principio y al final un 20 % del tiempo (para leerlo)
const MOVING_FRACTION = 0.6;
const MIN_DURATION_SECONDS = 4;

// Muestra el texto en una sola línea. Si no cabe en el ancho disponible, lo desliza de un
// extremo a otro con una pausa en cada lado, para que pueda leerse completo. Si cabe, queda
// quieto. Con "reducir movimiento" activado en el sistema no se anima y se corta con "…".
export default function MarqueeText({ text, className = "" }: MarqueeTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowPx, setOverflowPx] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const inner = textRef.current;
    if (!container || !inner || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      setOverflowPx(
        Math.max(0, Math.ceil(inner.offsetWidth - container.clientWidth)),
      );
    };

    // Primera medición al montar, sin esperar al observador
    const firstMeasure = setTimeout(measure, 0);

    // Se vuelve a medir si cambia el ancho disponible o el propio texto
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(inner);

    return () => {
      clearTimeout(firstMeasure);
      observer.disconnect();
    };
  }, [text]);

  const isOverflowing = overflowPx > 1;
  const durationSeconds = Math.max(
    MIN_DURATION_SECONDS,
    overflowPx / PIXELS_PER_SECOND / MOVING_FRACTION,
  );

  return (
    <span
      ref={containerRef}
      title={text}
      className={`marquee-box block overflow-hidden whitespace-nowrap ${className}`}
    >
      <span
        ref={textRef}
        className={`marquee-inner inline-block ${isOverflowing ? "marquee-run" : ""}`}
        style={
          isOverflowing
            ? ({
                "--marquee-distance": `-${overflowPx}px`,
                "--marquee-duration": `${durationSeconds}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </span>
  );
}
