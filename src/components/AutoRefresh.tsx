"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AutoRefreshProps {
  intervalSeconds: number;
}

export default function AutoRefresh({ intervalSeconds }: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, intervalSeconds * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [router, intervalSeconds]);

  return null;
}
