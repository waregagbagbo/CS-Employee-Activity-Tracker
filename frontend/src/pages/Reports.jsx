import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { listReports } from "../services/reports";
import {
  FaFileAlt,
  FaEye,
  FaCheckCircle,
  FaLock
} from "react-icons/fa";

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listReports();
      setReports(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load activity reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullPage message="Loading reports..." />;

  if (error) {
    return (
      <div className="flex bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <FaFileAlt className="mr-2 text-indigo-600" />
          Activity Reports
        </h1>

        {reports.length === 0 ? (
          <p className="text-gray-500">No reports found</p>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Agent</th>
                  <th className="px-6 py-3 text-left">Activity</th>
                  <th className="px-6 py-3 text-left">Activity / Notes</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                  <th className="px-6 py-3 text-left">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4">
                      {report.shift_active_agent?.first_name}
                    </td>
                    <td className="px-6 py-4">
                      {report.shift_activity_type}
                    </td>
                    <td className="px-6 py-4">
                      {report.notes}
                    </td>
                    <td className="px-6 py-4">
                      {report.is_approved ? (
                        <span className="text-green-600 flex items-center">
                          <FaCheckCircle className="mr-1" />
                          Approved
                        </span>
                      ) : (
                        <span className="text-orange-500">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex space-x-3">
                      <button
                        onClick={() => navigate(`/reports/${report.id}`)}
                        className="text-indigo-600 hover:text-indigo-800"
                        title="View report"
                      >
                        <FaEye />
                      </button>

                      {!report.is_approved ? (
                        <button
                          onClick={() =>
                            navigate(`/reports/${report.id}/approve`)
                          }
                          className="text-green-600 hover:text-green-800"
                          title="Approve report"
                        >
                          <FaCheckCircle />
                        </button>
                      ) : (
                        <FaLock className="text-gray-400" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
