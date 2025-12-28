import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { getReport, updateReport } from "../services/reports";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaClock,
  FaFileAlt,
} from "react-icons/fa";

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canApprove, setCanApprove] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await getReport(id);
      setReport(res.data);

      // permission check based on exposed fields
      if ("is_approved" in res.data) {
        setCanApprove(true);
      }
    } catch (err) {
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const approve = async () => {
    try {
      await updateReport(id, {
        is_approved: true,
        activity_status: "Approved",
        activity_approved_at: new Date().toISOString(),
      });
      fetchReport();
    } catch {
      alert("Approval failed");
    }
  };

  const reject = async () => {
    try {
      await updateReport(id, {
        is_approved: false,
        activity_status: "Rejected",
      });
      fetchReport();
    } catch {
      alert("Rejection failed");
    }
  };

  if (loading) return <Loader fullPage message="Loading report..." />;

  if (error) {
    return (
      <div className="flex">
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

      <div className="flex-1 p-6 max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-indigo-600 hover:text-indigo-700 mb-6"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <FaFileAlt className="mr-2 text-indigo-600" />
                {report.activity_type}
              </h1>
              <p className="text-gray-500 mt-1">
                Status:{" "}
                <span className="font-semibold">
                  {report.activity_status}
                </span>
              </p>
            </div>

            {report.is_approved && (
              <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm">
                Approved
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center text-gray-700">
              <FaUser className="mr-2 text-indigo-500" />
              Agent: {report.shift_active_agent?.user?.username}
            </div>

            {report.supervisor && (
              <div className="flex items-center text-gray-700">
                <FaUser className="mr-2 text-purple-500" />
                Supervisor: {report.supervisor?.user?.username}
              </div>
            )}

            <div className="flex items-center text-gray-700">
              <FaClock className="mr-2 text-indigo-500" />
              Created: {new Date(report.created_at).toLocaleString()}
            </div>

            {report.activity_approved_at && (
              <div className="flex items-center text-gray-700">
                <FaClock className="mr-2 text-green-500" />
                Approved:{" "}
                {new Date(report.activity_approved_at).toLocaleString()}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">
              {report.description || "No description provided"}
            </p>
          </div>

          {/* Supervisor Actions */}
          {canApprove && !report.is_approved && (
            <div className="flex space-x-4 pt-4 border-t">
              <button
                onClick={approve}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                <FaCheckCircle />
                <span>Approve</span>
              </button>

              <button
                onClick={reject}
                className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
              >
                <FaTimesCircle />
                <span>Reject</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
