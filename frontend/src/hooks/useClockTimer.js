import { useState, useEffect } from "react";

export default function useLiveTimer(clockInTime) {
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    // Reset if no clock-in time
    if (!clockInTime) {
      setElapsed("00:00:00");
      return;
    }

    // Parse backend datetime string safely
    const start = new Date(clockInTime);
    if (isNaN(start.getTime())) {
      console.error("Invalid clockInTime:", clockInTime);
      setElapsed("00:00:00");
      return;
    }

    const tick = () => {
      const diff = Date.now() - start.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    // Start ticking
    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [clockInTime]);

  return elapsed;
}
