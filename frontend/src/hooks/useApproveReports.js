// useApproveReport.js
import { approveReport } from "../api/reports.api";

export function useApproveReport() {
  const approve = async (id) => {
    return await approveReport(id);
  };

  return { approve };
}
