import API from "./api";

export const ReportService = {
  /**
   * Fetches paginated data mapping perfectly to: /reports/?page=X
   */
  async getReports(page = 1) {
    const response = await API.get(`api/reports/?page=${page}`);
    return {
      results: response.data?.results || [],
      hasNext: !!response.data?.next,
      hasPrev: !!response.data?.previous,
    };
  },

  /**
   * Dispatches payloads to your DRF creation view at: /reports/
   */
  async createReport(reportData) {
    const response = await API.post("api/reports/", {
      attendance: parseInt(reportData.attendance, 10),
      shift_activity_type: reportData.shift_activity_type,
      report_type: reportData.report_type,
      activity_description: reportData.activity_description,
      tickets_resolved: parseInt(reportData.tickets_resolved, 10) || 0,
      calls_made: parseInt(reportData.calls_made, 10) || 0,
      issues_escalated: parseInt(reportData.issues_escalated, 10) || 0,
      notes: reportData.notes || "",
    });
    return response.data;
  },

  /**
   * Hits your custom detail action path at: /reports/{id}/approve/
   */
  async approveReport(reportId) {
    const response = await API.post(`/reports/${reportId}/approve/`);
    return response.data;
  },
};
