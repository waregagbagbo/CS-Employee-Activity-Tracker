import React, { useEffect, useState } from "react";
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
  FaEye,
  FaPlay,
  FaStop,
  FaLock
} from "react-icons/fa";

export default function Shifts() {
  const navigate = useNavigate();

  const [shifts, setShifts] = useState([]);
  const [filteredShifts, setFilteredShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [userRole, setUserRole] = useState("");
  const [canEditShifts, setCanEditShifts] = useState(false);
  const [canCreateReports, setCanCreateReports] = useState(false);
  const [canApproveReports, setCanApproveReports] = useState(false);

  /* ==========================================================
     LOAD USER ROLE / PERMISSIONS
     ========================================================== */
  useEffect(() => {
    fetchUserRole();
    fetchShifts();
  }, []);

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://127.0.0.1:8000/api/employee/me", {
        headers: { Authorization: `Token ${token}` }
      });

      if (!res.ok) return;

      const data = await res.json();
      const profile = data.results ? data.results[0] : data;

      const userType = profile?.user_type || "";

      setUserRole(userType);

      if (userType === "Admin") {
        setCanEditShifts(true);
        setCanCreateReports(true);
        setCanApproveReports(true);
      } else if (userType === "Employee_Agent") {
        setCanEditShifts(true); // start / end
        setCanCreateReports(true);
      } else if (userType === "Supervisor") {
        setCanApproveReports(true);
      }
    } catch (err) {
      console.error("Role fetch failed", err);
    }
  };

  /* ==========================================================
     FETCH SHIFTS (NORMALIZED)
     ========================================================== */
  const fetchShifts = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await listShifts();
      const data = res.data.results || res.data;

      const normalized = data.map((shift) => ({
        id: shift.id,
        title: shift.shift_type,
        status: shift.shift_status,
        date: shift.shift_date,
        start_time: shift.shift_start_time,
        end_time: shift.shift_end_time,
        timer: shift.shift_timer_count,
        agentName: shift.shift_agent?.user?.username || "N/A"
      }));

      setShifts(normalized);
      setFilteredShifts(normalized);
    } catch (err) {
      setError("Failed to load shifts");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     SEARCH FILTER
     ========================================================== */
  useEffect(() => {
    if (!searchTerm) {
      setFilteredShifts(shifts);
      return;
    }

    const term = searchTerm.toLowerCase();
    setFilteredShifts(
      shifts.filter(
        (s) =>
          s.title.toLowerCase().includes(term) ||
          s.agentName.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, shifts]);

  /* ==========================================================
     ACTIONS
     ========================================================== */
  const handleStart = async (id) => {
    try {
      await startShift(id);
      fetchShifts();
    } catch {
      alert("Cannot start shift");
    }
  };

  const handleEnd = async (id) => {
    try {
      await endShift(id);
      fetchShifts();
    } catch (err) {
      alert(err.response?.data?.error || "Cannot end shift");
    }
  };

  /* ==========================================================
     STATUS COLOR
     ========================================================== */
  const statusBadge = (status) => {
    if (status === "Scheduled") return "bg-blue-100 text-blue-700";
    if (status === "In Progress") return "bg-green-100 text-green-700";
    if (status === "Completed") return "bg-gray-100 text-gray-700";
    return "bg-gray-100 text-gray-700";
  };

  /* ==========================================================
     RENDER
     ========================================================== */
  if (loading) return <Loader fullPage message="Loading shifts..." />;

  return (
    <div className="flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <FaCalendarAlt className="mr-3 text-indigo-600" />
          Shifts
        </h1>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 mb-6">
          {canCreateReports && (
            <button
              onClick={() => navigate("/reports/new")}
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Add Report
            </button>
          )}

          {canApproveReports && (
            <button
              onClick={() => navigate("/reports")}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg"
            >
              Approve Reports
            </button>
          )}
        </div>

        {/* SEARCH */}
        <div className="relative mb-6">
          <FaSearch className="absolute left-4 top-3 text-gray-400" />
          <input
            className="pl-10 py-2 border rounded w-full"
            placeholder="Search by shift or agent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* SHIFTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShifts.map((shift) => (
            <div
              key={shift.id}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">{shift.title}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs ${statusBadge(
                    shift.status
                  )}`}
                >
                  {shift.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-1">
                <FaUser className="inline mr-2" />
                {shift.agentName}
              </p>

              <p className="text-sm text-gray-600 mb-1">
                <FaClock className="inline mr-2" />
                {shift.start_time || "--"} → {shift.end_time || "--"}
              </p>

              <p className="text-xs text-gray-500 mb-4">{shift.timer}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/shifts/${shift.id}`)}
                  className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded"
                >
                  <FaEye className="inline mr-1" />
                  View
                </button>

                {shift.status === "Scheduled" && canEditShifts && (
                  <button
                    onClick={() => handleStart(shift.id)}
                    className="flex-1 bg-green-50 text-green-600 py-2 rounded"
                  >
                    <FaPlay className="inline mr-1" />
                    Start
                  </button>
                )}

                {shift.status === "In Progress" && canEditShifts && (
                  <button
                    onClick={() => handleEnd(shift.id)}
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded"
                  >
                    <FaStop className="inline mr-1" />
                    End
                  </button>
                )}

                {!canEditShifts && (
                  <button
                    disabled
                    className="flex-1 bg-gray-100 text-gray-400 py-2 rounded"
                  >
                    <FaLock className="inline mr-1" />
                    Locked
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredShifts.length === 0 && (
          <p className="text-center text-gray-500 mt-10">
            No shifts found
          </p>
        )}
      </div>
    </div>
  );
}
