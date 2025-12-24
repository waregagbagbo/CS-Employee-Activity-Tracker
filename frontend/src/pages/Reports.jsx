import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import axios from "axios";
import {
  FaFileAlt,
  FaSearch,
  FaPlus,
  FaCheck,
  FaTimes,
  FaEye,
  FaEdit,
  FaTrash,
  FaFilter,
  FaClock,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaLock
} from "react-icons/fa";

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // User permissions
  const [userRole, setUserRole] = useState("");
  const [canCreateReports, setCanCreateReports] = useState(false);
  const [canApproveReports, setCanApproveReports] = useState(false);
  const [canEditReports, setCanEditReports] = useState(false);
  const [canDeleteReports, setCanDeleteReports] = useState(false);

  useEffect(() => {
    checkUserPermissions();
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [searchTerm, filterStatus, reports]);

  const checkUserPermissions = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      if (!token) return;

      const response = await fetch('http://127.0.0.1:8000/api/user/profile/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        const { is_staff, is_superuser, user_type } = userData;

        setUserRole(user_type || (is_staff ? "Staff" : "User"));

        // Set permissions based on role
        if (is_staff || user_type === "Admin") {
          setCanCreateReports(true);
          setCanApproveReports(true);
          setCanEditReports(true);
          setCanDeleteReports(true);
        } else if (user_type === "Employee_Agent") {
          setCanCreateReports(true);
          setCanApproveReports(false);
          setCanEditReports(false);
          setCanDeleteReports(false);
        } else if (user_type === "Supervisor") {
          setCanCreateReports(false);
          setCanApproveReports(true);
          setCanEditReports(false);
          setCanDeleteReports(false);
        }

        console.log("Report permissions:", { user_type, canCreateReports: is_staff || user_type === "Employee_Agent", canApproveReports: is_staff || user_type === "Supervisor" });
      }
    } catch (err) {
      console.error("Error checking permissions:", err);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      const response = await axios.get('http://127.0.0.1:8000/api/reports/', {
        headers: {
          'Authorization': `Token ${token}`,
        }
      });

      const reportsData = response.data.results || response.data || [];
      setReports(reportsData);
    } catch (err) {
      console.error("Reports fetch error:", err);

      // Mock data for demo
      const mockReports = [
        {
          id: 1,
          title: "Morning Shift Report",
          description: "All tasks completed successfully",
          shift: "Morning Shift",
          submitted_by: "John Doe",
          status: "pending",
          created_at: "2024-12-23T08:00:00Z",
        },
        {
          id: 2,
          title: "Evening Operations Summary",
          description: "Minor delay in delivery but resolved",
          shift: "Evening Shift",
          submitted_by: "Jane Smith",
          status: "approved",
          created_at: "2024-12-22T16:30:00Z",
        },
        {
          id: 3,
          title: "Night Security Report",
          description: "No incidents reported",
          shift: "Night Shift",
          submitted_by: "Mike Johnson",
          status: "rejected",
          created_at: "2024-12-22T00:15:00Z",
          rejection_reason: "Missing required details"
        }
      ];
      setReports(mockReports);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((report) =>
        report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.submitted_by?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((report) => report.status === filterStatus);
    }

    setFilteredReports(filtered);
  };

  const handleApproveReport = async (reportId) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      await axios.patch(
        `http://127.0.0.1:8000/api/reports/${reportId}/`,
        { status: "approved" },
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess("Report approved successfully!");
      setTimeout(() => setSuccess(""), 3000);
      fetchReports();
    } catch (err) {
      console.error("Approval error:", err);
      setError(err.response?.data?.detail || "Failed to approve report");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleRejectReport = async (reportId) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      await axios.patch(
        `http://127.0.0.1:8000/api/reports/${reportId}/`,
        { status: "rejected", rejection_reason: reason },
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess("Report rejected successfully!");
      setTimeout(() => setSuccess(""), 3000);
      fetchReports();
    } catch (err) {
      console.error("Rejection error:", err);
      setError(err.response?.data?.detail || "Failed to reject report");
      setTimeout(() => setError(""), 3000);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center">
            <FaClock className="mr-1" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center">
            <FaCheckCircle className="mr-1" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center">
            <FaTimesCircle className="mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Loader fullPage message="Loading reports..." />;
  }

  return (
    <div className="flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <div className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div className="mb-4 md:mb-0">
                  <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <FaFileAlt className="mr-3 text-indigo-600" />
                    Shift Reports
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage and review shift reports ({reports.length} total)
                  </p>
                  {userRole && (
                    <p className="text-sm mt-1 flex items-center">
                      <span className="font-medium text-gray-700">Role: {userRole}</span>
                      {canApproveReports && !canCreateReports && (
                        <span className="ml-2 text-purple-600 flex items-center">
                          <FaCheck className="mr-1" />
                          Can approve reports
                        </span>
                      )}
                      {canCreateReports && (
                        <span className="ml-2 text-blue-600 flex items-center">
                          <FaPlus className="mr-1" />
                          Can create reports
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Add Report Button */}
                {canCreateReports ? (
                  <button
                    onClick={() => navigate("/reports/new")}
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition shadow-md hover:shadow-lg"
                  >
                    <FaPlus />
                    <span className="font-medium">Add Report</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex items-center space-x-2 bg-gray-300 text-gray-500 px-6 py-3 rounded-lg cursor-not-allowed opacity-60"
                    title="You don't have permission to create reports"
                  >
                    <FaLock />
                    <span className="font-medium">Add Report</span>
                  </button>
                )}
              </div>

              {/* Success/Error Messages */}
              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start">
                  <FaCheck className="mr-2 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                  <FaExclamationCircle className="mr-2 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Search and Filter Bar */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by title, description, or author..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reports List */}
            {filteredReports.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaFileAlt className="text-gray-400 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Reports Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterStatus !== "all"
                    ? "No reports match your filters"
                    : "No reports have been submitted yet"}
                </p>
                {canCreateReports && !searchTerm && filterStatus === "all" && (
                  <button
                    onClick={() => navigate("/reports/new")}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Create First Report
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                        <div className="flex-1 mb-4 md:mb-0">
                          <div className="flex items-start space-x-3">
                            <div className="mt-1">
                              {getStatusBadge(report.status)}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-800 mb-1">
                                {report.title}
                              </h3>
                              <p className="text-gray-600 text-sm mb-3">
                                {report.description}
                              </p>
                              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <FaUser className="mr-2 text-indigo-500" />
                                  {report.submitted_by}
                                </span>
                                <span className="flex items-center">
                                  <FaFileAlt className="mr-2 text-indigo-500" />
                                  {report.shift}
                                </span>
                                <span className="flex items-center">
                                  <FaClock className="mr-2 text-indigo-500" />
                                  {formatDate(report.created_at)}
                                </span>
                              </div>
                              {report.rejection_reason && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <p className="text-sm text-red-700">
                                    <strong>Rejection Reason:</strong> {report.rejection_reason}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          {/* View Button - Everyone */}
                          <button
                            onClick={() => navigate(`/reports/${report.id}`)}
                            className="flex items-center space-x-1 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-sm"
                          >
                            <FaEye />
                            <span>View</span>
                          </button>

                          {/* Approve/Reject - Supervisors and Admins */}
                          {canApproveReports && report.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApproveReport(report.id)}
                                className="flex items-center space-x-1 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm"
                              >
                                <FaCheck />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleRejectReport(report.id)}
                                className="flex items-center space-x-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm"
                              >
                                <FaTimes />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {/* Edit - Admins only */}
                          {canEditReports && (
                            <button
                              onClick={() => navigate(`/reports/${report.id}/edit`)}
                              className="flex items-center space-x-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm"
                            >
                              <FaEdit />
                              <span>Edit</span>
                            </button>
                          )}

                          {/* Delete - Admins only */}
                          {canDeleteReports && (
                            <button
                              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}