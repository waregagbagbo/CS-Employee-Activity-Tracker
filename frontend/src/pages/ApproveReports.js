import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { listReports, approveReport } from "../services/reports";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaFileAlt,
} from "react-icons/fa";

export default function ApproveReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await listReports();
      // Show only unapproved reports
      const pending = res.data.results.filter(
        (r) => !r.is_approved
      );
      setReports(pending);
    } catch (err) {
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId) => {
    try {
      await approveReport(reportId, {
        is_approved: true,
        activity_status: "Approved",
        activity_approved_at: new Date().toISOString(),
      });
      loadReports();
    } catch (err) {
      alert("Approval failed");
    }
  };

  const handleReject = async (reportId) => {
    try {
      await approveReport(reportId, {
        is_approved: false,
        activity_status: "Rejected",
      });
      loadReports();
    } catch (err) {
      alert("Rejection failed");
    }
  };

  if (loading) return <Loader fullPage message="Loading reports..." />;

  return (
    <div className="flex bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <FaFileAlt className="mr-2 text-indigo-600" />
          Approve Activity Reports
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-600">No pending reports</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow p-6 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {report.activity_type}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Agent: {report.shift_active_agent?.user?.username}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {report.description}
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleApprove(report.id)}
                    className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <FaCheckCircle />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => handleReject(report.id)}
                    className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    <FaTimesCircle />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
