import { useEffect, useState } from "react";

/**
 * useShiftTimer
 * @param {string|null} startTime - shift_start_time (HH:MM:SS)
 * @param {string} status - shift_status
 */
export default function useShiftTimer(startTime, status) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startTime || status !== "In Progress") return;

    const now = new Date();
    const [h, m, s] = startTime.split(":").map(Number);

    const start = new Date();
    start.setHours(h, m, s || 0, 0);

    // handle overnight shift
    if (start > now) {
      start.setDate(start.getDate() - 1);
    }

    const tick = () => {
      const diff = Math.floor((Date.now() - start.getTime()) / 1000);
      setElapsedSeconds(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [startTime, status]);

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const remainingSeconds = Math.max(0, 8 * 3600 - elapsedSeconds);

  return {
    elapsedSeconds,
    hours,
    minutes,
    seconds,
    remainingSeconds,
    isComplete: elapsedSeconds >= 8 * 3600,
  };
}
