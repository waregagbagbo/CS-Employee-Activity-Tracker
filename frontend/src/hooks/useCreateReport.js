// useCreateReport.js
import { createReport } from "../api/reports.api";

export function useCreateReport() {
  const submit = async (payload) => {
    return await createReport(payload);
  };

  return { submit };
}
