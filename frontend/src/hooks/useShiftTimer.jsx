import { useEffect, useState } from "react";

export default function useShiftTimer(startTime, status) {
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    if (!startTime || status !== "In Progress") {
      setElapsed("00:00:00");
      return;
    }

    const start = new Date(startTime);

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.max(0, now - start);

      const hours = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const minutes = String(
        Math.floor((diff % 3600000) / 60000)
      ).padStart(2, "0");
      const seconds = String(
        Math.floor((diff % 60000) / 1000)
      ).padStart(2, "0");

      setElapsed(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, status]);

  return elapsed;
}
