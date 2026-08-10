"use client";
import { useEffect, useRef, useState } from "react";

export function useSmoothSticky<T extends HTMLElement>() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<T>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const target = targetRef.current;
    if (!sentinel || !target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStuck(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return { sentinelRef, targetRef, stuck };
}
