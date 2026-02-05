// useSupervisorReports.js
import { useEffect, useState } from "react";
import { listReports } from "../api/reports.api";

export function useSupervisorReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    listReports()
      .then(res => setReports(res.data.results ?? res.data));
  }, []);

  return { reports };
}
