"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCountdown } from "@/lib/schedule/format";

interface CountdownProps {
  /** Momento (ISO 8601) hacia el que se cuenta */
  targetIso: string;
}

const TICK_MS = 1000;
const REFRESH_RETRY_MS = 3000;
const MAX_REFRESH_ATTEMPTS = 10;

// Cuenta regresiva hasta `targetIso`. Al llegar a cero pide a Next que vuelva a cargar
// los datos del servidor, para que el horario pase de "Próximamente" a "Al aire".
export default function Countdown({ targetIso }: CountdownProps) {
  const router = useRouter();
  // Sin valor hasta montar en el navegador: así el servidor y el cliente dibujan lo mismo
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(targetIso).getTime();
    let refreshCount = 0;
    let lastRefreshAt = 0;

    const tick = () => {
      const now = Date.now();
      const remaining = target - now;
      setRemainingMs(Math.max(remaining, 0));

      // Al llegar a cero se recargan los datos del servidor. Si el reloj de este dispositivo va
      // unos segundos adelantado y el servidor aún no ve empezar el programa, se reintenta
      // cada pocos segundos (unas pocas veces) hasta que el cartel cambie y este componente desaparezca.
      if (
        remaining <= 0 &&
        refreshCount < MAX_REFRESH_ATTEMPTS &&
        now - lastRefreshAt >= REFRESH_RETRY_MS
      ) {
        refreshCount += 1;
        lastRefreshAt = now;
        router.refresh();
      }
    };

    const firstTick = setTimeout(tick, 0);
    const interval = setInterval(tick, TICK_MS);

    return () => {
      clearTimeout(firstTick);
      clearInterval(interval);
    };
  }, [targetIso, router]);

  // Mientras no hay valor se reserva el espacio para que la tarjeta no "salte"
  if (remainingMs === null) {
    return <span className="invisible">Empieza en 0 s</span>;
  }

  return (
    <span>
      {remainingMs === 0
        ? "Empieza ahora"
        : `Empieza en ${formatCountdown(remainingMs)}`}
    </span>
  );
}
