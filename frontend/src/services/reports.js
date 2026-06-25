import API from "./api";

const ReportService = {
  // LIST (role-filtered automatically by backend)
  list: (params) => API.get("/api/reports/", { params }),

  // RETRIEVE single report
  get: (id) => API.get(`/api/reports/${id}/`),

  // CREATE new report
  create: (data) => API.post("/api/reports/", data),

  // UPDATE report (employee edits before approval)
  update: (id, data) => API.patch(`/api/reports/${id}/`, data),

  // DELETE report
  delete: (id) => API.delete(`/api/reports/${id}/`),

  // APPROVE (Supervisor/Admin only)
  approve: (id) => API.post(`/api/reports/${id}/approve/`),

  // REJECT (Supervisor/Admin only)
  reject: (id) => API.post(`/api/reports/${id}/reject/`),

  // GET pending reports for supervisor
  getPendingApproval: (params) =>
    API.get("/api/reports/pending_approval/", { params }),

  // GET analytics
  getAnalytics: (params) =>
    API.get("/api/reports/analytics/", { params }),

  // DOWNLOAD report as PDF
  downloadPDF: (id) =>
    API.get(`/api/reports/${id}/download_pdf/`, { responseType: 'blob' }),
};

export default ReportService;