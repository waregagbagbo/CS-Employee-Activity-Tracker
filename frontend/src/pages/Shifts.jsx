import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { listShifts, startShift, endShift } from "../services/shifts";
import {
  FaCalendarAlt,
  FaSearch,
  FaPlus,
  FaClock,
  FaUser,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaEdit,
  FaTrash,
  FaEye,
  FaFileAlt,
  FaLock,
  FaPlay,
  FaStop
} from "react-icons/fa";

export default function Shifts() {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [filteredShifts, setFilteredShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  // User role state
  const [userRole, setUserRole] = useState("");
  const [canCreateShifts, setCanCreateShifts] = useState(false);
  const [canEditShifts, setCanEditShifts] = useState(false);
  const [canDeleteShifts, setCanDeleteShifts] = useState(false);
  const [canCreateReports, setCanCreateReports] = useState(false);
  const [canApproveReports, setCanApproveReports] = useState(false);

  useEffect(() => {
    checkUserPermissions();
    fetchShifts();
  }, []);

  useEffect(() => {
    // Filter shifts based on search term
    if (searchTerm) {
      const filtered = shifts.filter((shift) => {
        const title = shift.title || shift.shift_name || "";
        const employeeName = shift.employee_name || shift.shift_agent_name || shift.agent?.username || "";
        const department = shift.department || shift.department_name || "";

        const searchLower = searchTerm.toLowerCase();

        return (
          title.toLowerCase().includes(searchLower) ||
          employeeName.toLowerCase().includes(searchLower) ||
          department.toLowerCase().includes(searchLower)
        );
      });
      setFilteredShifts(filtered);
    } else {
      setFilteredShifts(shifts);
    }
  }, [searchTerm, shifts]);

  const checkUserPermissions = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch user profile to get user_type
      const response = await fetch('http://127.0.0.1:8000/cs/employee_profile/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();

        const isSuperuser = userData.is_superuser;
        const isStaff = userData.is_staff;
        const userType = userData.user_type || "";

        console.log("User permissions:", { isSuperuser, isStaff, userType });

        // Set display role
        let displayRole = userType || (isSuperuser ? "System Admin" : isStaff ? "Staff" : "User");
        setUserRole(displayRole);

        // ================================================================
        // FRONTEND PERMISSIONS (matches your backend logic)
        // ================================================================

        // ADMIN: Full access (create, view, update, delete)
        if (isStaff || userType === "Admin") {
          setCanCreateShifts(true);
          setCanEditShifts(true);
          setCanDeleteShifts(true);
          setCanCreateReports(true);
          setCanApproveReports(true);
          console.log("✅ Admin: Full access");
        }
        // EMPLOYEE_AGENT: Create and view shifts/reports
        else if (userType === "Employee_Agent") {
          setCanCreateShifts(true);    // Can create shifts
          setCanEditShifts(true);      // ✅ Can start/end shifts (edit permission)
          setCanDeleteShifts(false);   // Cannot delete
          setCanCreateReports(true);   // Can create reports
          setCanApproveReports(false); // Cannot approve
          console.log("✅ Employee Agent: Create shifts, start/end shifts, create reports");
        }
        // SUPERVISOR: View shifts, view and update reports
        else if (userType === "Supervisor") {
          setCanCreateShifts(false);   // Cannot create shifts
          setCanEditShifts(false);     // Cannot update shifts
          setCanDeleteShifts(false);   // Cannot delete shifts
          setCanCreateReports(false);  // Cannot create reports
          setCanApproveReports(true);  // Can update/approve reports
          console.log("✅ Supervisor: View shifts + approve reports");
        }
        // DEFAULT: No permissions
        else {
          setCanCreateShifts(false);
          setCanEditShifts(false);
          setCanDeleteShifts(false);
          setCanCreateReports(false);
          setCanApproveReports(false);
          console.log("❌ No permissions");
        }
      }
    } catch (err) {
      console.error("Error checking permissions:", err);
    }
  };

  const fetchShifts = async (pageNumber = 1) => {
    setLoading(true);
    setError("");

    try {
      // Use your API service
      const response = await listShifts({ page: pageNumber });

      console.log("Shifts response:", response.data);

      // Handle different response structures
      let shiftsData = [];

      if (response.data.results) {
        // Paginated response
        shiftsData = response.data.results;
        setNextPage(response.data.next);
        setPrevPage(response.data.previous);
      } else if (Array.isArray(response.data)) {
        // Direct array
        shiftsData = response.data;
        setNextPage(null);
        setPrevPage(null);
      }

      console.log("Shifts loaded:", shiftsData.length);
      setShifts(shiftsData);

    } catch (err) {
      console.error("Shifts fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load shifts");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to safely get field values
  const getShiftTitle = (shift) => {
    return shift?.title || shift?.shift_type || `Shift #${shift?.id || ''}`;
  };

  const getShiftEmployee = (shift) => {
    return shift?.employee_name ||
           shift?.shift_agent_name ||
           shift?.agent?.username ||
           shift?.shift_agent?.user?.username ||
           "Unassigned";
  };

  const getShiftDate = (shift) => {
    if (shift?.date) return shift.date;
    if (shift?.shift_date) return shift.shift_date;
    if (shift?.created_at) return new Date(shift.created_at).toLocaleDateString();
    return "No date";
  };

  const getShiftDepartment = (shift) => {
    return shift?.department ||
           shift?.department_name ||
           shift?.department?.title ||
           "No department";
  };

  const handleStartShift = async (shiftId) => {
    try {
      const response = await startShift(shiftId);
      console.log("Start shift response:", response.data);

      setSuccess("Shift started successfully!");
      setTimeout(() => setSuccess(""), 3000);

      // Refresh shifts
      fetchShifts(page);
    } catch (err) {
      console.error("Start shift error:", err);
      setError(err.response?.data?.detail || "Failed to start shift");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleEndShift = async (shiftId) => {
    try {
      const response = await endShift(shiftId);
      console.log("End shift response:", response.data);

      setSuccess("Shift ended successfully!");
      setTimeout(() => setSuccess(""), 3000);

      // Refresh shifts
      fetchShifts(page);
    } catch (err) {
      console.error("End shift error:", err);
      setError(err.response?.data?.detail || "Failed to end shift");
      setTimeout(() => setError(""), 3000);
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || "";

    switch (statusLower) {
      case "scheduled":
      case "pending":
        return "bg-blue-100 text-blue-700";
      case "active":
      case "in_progress":
      case "ongoing":
        return "bg-green-100 text-green-700";
      case "completed":
      case "finished":
        return "bg-gray-100 text-gray-700";
      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handlePrev = () => {
    if (prevPage) {
      setPage(page - 1);
      fetchShifts(page - 1);
    }
  };

  const handleNext = () => {
    if (nextPage) {
      setPage(page + 1);
      fetchShifts(page + 1);
    }
  };

  if (loading) {
    return <Loader fullPage message="Loading shifts..." />;
  }

  if (error) {
    return (
      <div className="flex bg-gray-50">
        <Sidebar />
        <div className="flex-1 min-h-screen flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCalendarAlt className="text-red-600 text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Shifts</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchShifts}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <div className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div className="mb-4 md:mb-0">
                  <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <FaCalendarAlt className="mr-3 text-indigo-600" />
                    Shifts Management
                  </h1>
                  <p className="text-gray-600 mt-1">
                    View and manage work shifts ({shifts.length} total)
                  </p>
                  {/* Role-based access message */}
                  {userRole && (
                    <p className="text-sm mt-1 flex items-center">
                      <span className="font-medium text-gray-700">Role: {userRole}</span>
                      {userRole === "Supervisor" && (
                        <span className="ml-2 text-orange-600 flex items-center">
                          <FaEye className="mr-1" />
                          View shifts only • Can approve reports
                        </span>
                      )}
                      {userRole === "Employee Agent" && (
                        <span className="ml-2 text-blue-600 flex items-center">
                          <FaPlus className="mr-1" />
                          Can add shifts & reports
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Action Buttons - Role-based display */}
                <div className="flex space-x-3">
                  {/* Add Shift Report Button - Employee_Agent and Admin */}
                  {canCreateReports ? (
                    <button
                      onClick={() => navigate("/reports/new")}
                      className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition shadow-md hover:shadow-lg"
                    >
                      <FaFileAlt />
                      <span className="font-medium">Add Shift Report</span>
                    </button>
                  ) : canApproveReports ? (
                    <button
                      onClick={() => navigate("/reports/approve")}
                      className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition shadow-md hover:shadow-lg"
                    >
                      <FaFileAlt />
                      <span className="font-medium">Approve Reports</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex items-center space-x-2 bg-gray-300 text-gray-500 px-6 py-3 rounded-lg cursor-not-allowed opacity-60"
                      title="You don't have permission for reports"
                    >
                      <FaLock />
                      <span className="font-medium">Reports</span>
                    </button>
                  )}

                  {/* Add Shift Button - Employee_Agent and Admin */}
                  {canCreateShifts ? (
                    <button
                      onClick={() => navigate("/shifts/new")}
                      className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition shadow-md hover:shadow-lg"
                    >
                      <FaPlus />
                      <span className="font-medium">Add Shift</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex items-center space-x-2 bg-gray-300 text-gray-500 px-6 py-3 rounded-lg cursor-not-allowed opacity-60"
                      title={
                        userRole === "Supervisor"
                          ? "Supervisors can only view shifts"
                          : "You don't have permission to add shifts"
                      }
                    >
                      <FaLock />
                      <span className="font-medium">Add Shift</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Success/Error Messages */}
              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start">
                  <FaPlay className="mr-2 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                  <FaLock className="mr-2 mt-0.5" />
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
                      placeholder="Search by title, employee, or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-4 py-2 rounded-lg transition ${
                        viewMode === "grid"
                          ? "bg-white shadow-md text-indigo-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-4 py-2 rounded-lg transition ${
                        viewMode === "list"
                          ? "bg-white shadow-md text-indigo-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      List
                    </button>
                  </div>

                  {/* Filter Button */}
                  <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <FaFilter className="text-gray-600" />
                    <span className="text-gray-700">Filters</span>
                  </button>
                </div>
              </div>
            </div>

            {/* No Results Message */}
            {filteredShifts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCalendarAlt className="text-gray-400 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Shifts Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? `No results for "${searchTerm}"`
                    : "No shifts scheduled yet"}
                </p>
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Clear Search
                  </button>
                ) : canCreateShifts ? (
                  <button
                    onClick={() => navigate("/shifts/new")}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Create First Shift
                  </button>
                ) : (
                  <p className="text-gray-500 text-sm">Contact an administrator to create shifts</p>
                )}
              </div>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {filteredShifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                      >
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">
                              {getShiftTitle(shift)}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(shift.status)}`}>
                              {shift.status || "unknown"}
                            </span>
                          </div>
                          <p className="text-indigo-100 text-sm mt-1">
                            {getShiftDate(shift)}
                          </p>
                        </div>

                        {/* Card Content */}
                        <div className="px-6 py-4">
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center text-gray-600">
                              <FaUser className="mr-2 text-indigo-500" />
                              <span>{getShiftEmployee(shift)}</span>
                            </div>

                            <div className="flex items-center text-gray-600">
                              <FaClock className="mr-2 text-indigo-500" />
                              <span>
                                {shift.start_time || "00:00"} - {shift.end_time || "00:00"}
                              </span>
                            </div>

                            <div className="flex items-center text-gray-600">
                              <FaCalendarAlt className="mr-2 text-indigo-500" />
                              <span>{getShiftDepartment(shift)}</span>
                            </div>
                          </div>

                          {/* Action Buttons - Role-based */}
                          <div className="mt-4 pt-4 border-t border-gray-100 flex space-x-2">
                            {/* View button - Everyone can view */}
                            <button
                              onClick={() => navigate(`/shifts/${shift.id}`)}
                              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-sm"
                            >
                              <FaEye />
                              <span>View</span>
                            </button>

                            {/* Start/End Shift - For active shifts */}
                            {shift.status === "scheduled" && canEditShifts && (
                              <button
                                onClick={() => handleStartShift(shift.id)}
                                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm"
                              >
                                <FaPlay />
                                <span>Start</span>
                              </button>
                            )}

                            {(shift.status === "active" || shift.status === "in_progress") && canEditShifts && (
                              <button
                                onClick={() => handleEndShift(shift.id)}
                                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm"
                              >
                                <FaStop />
                                <span>End</span>
                              </button>
                            )}

                            {/* Edit button - Admin only (not Shift Agent) */}
                            {canEditShifts ? (
                              <button
                                onClick={() => navigate(`/shifts/${shift.id}/edit`)}
                                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm"
                              >
                                <FaEdit />
                                <span>Edit</span>
                              </button>
                            ) : (
                              <button
                                disabled
                                title="You don't have permission to edit shifts"
                                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-sm"
                              >
                                <FaLock />
                                <span>Edit</span>
                              </button>
                            )}

                            {/* Delete button - Admin only (not Shift Agent) */}
                            {canDeleteShifts ? (
                              <button
                                className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm"
                              >
                                <FaTrash />
                              </button>
                            ) : (
                              <button
                                disabled
                                title="You don't have permission to delete shifts"
                                className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-sm"
                              >
                                <FaLock />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* List View */}
                {viewMode === "list" && (
                  <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                            Shift
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">
                            Employee
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">
                            Time
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredShifts.map((shift) => (
                          <tr key={shift.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {shift.title || shift.shift_name || `Shift #${shift.id}`}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {shift.date || shift.shift_date || new Date(shift.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600 hidden md:table-cell">
                              {shift.employee_name || shift.shift_agent_name || shift.agent?.username || "Unassigned"}
                            </td>
                            <td className="px-6 py-4 text-gray-600 hidden lg:table-cell">
                              {shift.start_time || "00:00"} - {shift.end_time || "00:00"}
                            </td>
                            <td className="px-6 py-4 hidden lg:table-cell">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(shift.status)}`}>
                                {shift.status || "unknown"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                {/* View - Everyone */}
                                <button
                                  onClick={() => navigate(`/shifts/${shift.id}`)}
                                  className="text-indigo-600 hover:text-indigo-700"
                                  title="View details"
                                >
                                  <FaEye />
                                </button>

                                {/* Edit - Admin only */}
                                {canEditShifts ? (
                                  <button
                                    onClick={() => navigate(`/shifts/${shift.id}/edit`)}
                                    className="text-blue-600 hover:text-blue-700"
                                    title="Edit shift"
                                  >
                                    <FaEdit />
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="text-gray-300 cursor-not-allowed"
                                    title="You don't have permission to edit"
                                  >
                                    <FaLock />
                                  </button>
                                )}

                                {/* Delete - Admin only */}
                                {canDeleteShifts ? (
                                  <button
                                    className="text-red-600 hover:text-red-700"
                                    title="Delete shift"
                                  >
                                    <FaTrash />
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="text-gray-300 cursor-not-allowed"
                                    title="You don't have permission to delete"
                                  >
                                    <FaLock />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}