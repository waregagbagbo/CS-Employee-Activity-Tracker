// useMyReports.js
import { useEffect, useState } from "react";
import { listReports } from "../api/reports.api";

export function useMyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listReports()
      .then(res => setReports(res.data.results ?? res.data))
      .finally(() => setLoading(false));
  }, []);

  return { reports, loading };
}
