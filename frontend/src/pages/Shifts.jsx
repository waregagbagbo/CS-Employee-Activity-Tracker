import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { listShifts, startShift, endShift, createShift, updateShift } from "../services/shifts";
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

// Define available shift types for dropdown
const SHIFT_TYPES = [
  { value: "Day", label: "Day Shift" },
  { value: "Night", label: "Night Shift" },
  { value: "Remote", label: "Remote Shift" },
];

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

  // Role-based state
  const [userRole, setUserRole] = useState("");
  const [canCreateShifts, setCanCreateShifts] = useState(false);
  const [canEditShifts, setCanEditShifts] = useState(false);
  const [canDeleteShifts, setCanDeleteShifts] = useState(false);
  const [canCreateReports, setCanCreateReports] = useState(false);
  const [canApproveReports, setCanApproveReports] = useState(false);

  // Form state for create/edit
  const [form, setForm] = useState({
    title: "",
    shift_type: "",
    shift_date: "",
    start_time: "",
    end_time: "",
  });

  // Live timer state
  const [shiftTimers, setShiftTimers] = useState({});

  // ----------------- EFFECTS -----------------
  useEffect(() => {
    checkUserPermissions();
    fetchShifts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = shifts.filter((shift) => {
        const title = shift.title || shift.shift_type || "";
        const employeeName = shift.shift_agent?.username || "";
        const department = shift.department?.title|| "";


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

  // ----------------- USER PERMISSIONS -----------------
  const checkUserPermissions = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) return setLoading(false);

      const response = await fetch('http://127.0.0.1:8000/api/employee_profile/', {
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const userData = await response.json();
        const userType = userData.user_type || "";
        const isSuperuser = userData.is_superuser;
        const isStaff = userData.is_staff;
        setUserRole(userType || (isSuperuser ? "System Admin" : isStaff ? "Staff" : "User"));

        // Permissions
        if (isStaff || userType === "Admin") {
          setCanCreateShifts(true);
          setCanEditShifts(true);
          setCanDeleteShifts(true);
          setCanCreateReports(true);
          setCanApproveReports(true);
        } else if (userType === "Employee_Agent") {
          setCanCreateShifts(true);
          setCanEditShifts(true);
          setCanDeleteShifts(false);
          setCanCreateReports(true);
          setCanApproveReports(false);
        } else if (userType === "Supervisor") {
          setCanCreateShifts(false);
          setCanEditShifts(false);
          setCanDeleteShifts(false);
          setCanCreateReports(false);
          setCanApproveReports(true);
        } else {
          setCanCreateShifts(false);
          setCanEditShifts(false);
          setCanDeleteShifts(false);
          setCanCreateReports(false);
          setCanApproveReports(false);
        }
      }
    } catch (err) {
      console.error("Error checking permissions:", err);
    }
  };

  // ----------------- FETCH SHIFTS -----------------
  const fetchShifts = async (pageNumber = 1) => {
    setLoading(true);
    setError("");
    try {
      const response = await listShifts({ page: pageNumber });
      const shiftsData = response.data.results || response.data || [];
      setShifts(shiftsData);
      setNextPage(response.data.next || null);
      setPrevPage(response.data.previous || null);
    } catch (err) {
      console.error("Shifts fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load shifts");
    } finally { setLoading(false); }
  };

  // ----------------- SHIFT ACTIONS -----------------
  const handleStartShift = async (id) => {
    try {
      await startShift(id);
      setSuccess("Shift started!");
      fetchShifts(page);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to start shift");
    }
  };

  const handleEndShift = async (id) => {
    try {
      await endShift(id);
      setSuccess("Shift ended!");
      fetchShifts(page);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to end shift");
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      await createShift(form);
      setSuccess("Shift created!");
      setForm({ title: "", shift_type: "", shift_date: "", start_time: "", end_time: "" });
      fetchShifts(page);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to create shift");
    }
  };

  const handleUpdateShift = async (id) => {
    try {
      await updateShift(id, form);
      setSuccess("Shift updated!");
      fetchShifts(page);
    } catch (err) {
      console.error(err);
      setError("Failed to update shift");
    }
  };

  // ----------------- LIVE TIMER -----------------
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers = {};
      shifts.forEach(shift => {
        if (shift.status === "active" || shift.status === "in_progress") {
          const start = new Date(`1970-01-01T${shift.start_time || "00:00"}:00`);
          const now = new Date();
          const diff = ((now - start) / 1000 / 3600).toFixed(2); // hours
          newTimers[shift.id] = diff;
        }
      });
      setShiftTimers(newTimers);
    }, 1000);
    return () => clearInterval(interval);
  }, [shifts]);

  // ----------------- HELPER FUNCTIONS -----------------
  const getShiftTitle = (shift) => shift?.title || shift?.shift_type || `Shift #${shift?.id || ''}`;
  const getShiftEmployee = (shift) => shift?.shift_agent?.user?.username || "Unassigned";
  const getShiftDate = (shift) => shift?.shift_date || new Date(shift?.created_at).toLocaleDateString();
  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "scheduled": return "bg-blue-100 text-blue-700";
      case "active":
      case "in_progress": return "bg-green-100 text-green-700";
      case "completed": return "bg-gray-100 text-gray-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // ----------------- PAGINATION -----------------
  const handlePrev = () => { if (prevPage) { setPage(page-1); fetchShifts(page-1); } };
  const handleNext = () => { if (nextPage) { setPage(page+1); fetchShifts(page+1); } };

  // ----------------- RENDER -----------------
  if (loading) return <Loader fullPage message="Loading shifts..." />;
  if (error) return (
    <div className="flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <FaCalendarAlt className="text-red-600 text-2xl mx-auto mb-4"/>
          <h2 className="text-xl font-bold mb-2">Error Loading Shifts</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={fetchShifts} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">Try Again</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header & Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <FaCalendarAlt className="mr-3 text-indigo-600"/> Shifts Management
              </h1>
              <p className="text-gray-600 mt-1">{shifts.length} total shifts</p>
            </div>
            <div className="flex space-x-3">
              {canCreateShifts && <button onClick={() => navigate("/shifts/new")} className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"><FaPlus/><span>Add Shift</span></button>}
              {canCreateReports && <button onClick={() => navigate("/reports/new")} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center space-x-2"><FaFileAlt/><span>Add Report</span></button>}
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex items-center gap-4">
            <FaSearch className="text-gray-400"/>
            <input
              type="text"
              placeholder="Search shifts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border p-2 rounded"
            />
          </div>

          {/* Shift Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShifts.map((shift) => (
              <div key={shift.id} className="bg-white rounded-xl shadow-md hover:shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{getShiftTitle(shift)}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(shift.status)}`}>{shift.status}</span>
                  </div>
                  <p className="text-indigo-100 text-sm mt-1">{getShiftDate(shift)}</p>
                </div>
                <div className="px-6 py-4 space-y-2">
                  <p className="text-gray-600"><FaUser className="inline mr-1"/> {getShiftEmployee(shift)}</p>
                  <p className="text-gray-600"><FaClock className="inline mr-1"/> {shift.start_time || "00:00"} - {shift.end_time || "00:00"}</p>
                  {shiftTimers[shift.id] && <p className="text-green-600 font-semibold">Timer: {shiftTimers[shift.id]} hrs</p>}

                  {/* Action buttons */}
                  <div className="flex space-x-2 mt-2">
                    <button onClick={() => navigate(`/shifts/${shift.id}`)} className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm flex items-center justify-center space-x-1"><FaEye/><span>View</span></button>
                    {canEditShifts && shift.status === "scheduled" && <button onClick={() => handleStartShift(shift.id)} className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm flex items-center justify-center space-x-1"><FaPlay/><span>Start</span></button>}
                    {canEditShifts && (shift.status === "active" || shift.status === "in_progress") && <button onClick={() => handleEndShift(shift.id)} className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm flex items-center justify-center space-x-1"><FaStop/><span>End</span></button>}
                    {canEditShifts && <button onClick={() => navigate(`/shifts/${shift.id}/edit`)} className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm flex items-center justify-center space-x-1"><FaEdit/><span>Edit</span></button>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between mt-6">
            <button onClick={handlePrev} disabled={!prevPage} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Prev</button>
            <button onClick={handleNext} disabled={!nextPage} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
