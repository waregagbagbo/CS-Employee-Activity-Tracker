import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import DashboardCard from "../components/DashboardCard";
import Loader from "../components/Loader";
import axios from "axios";
import {
  FaUsers,
  FaCalendarCheck,
  FaFileAlt,
  FaBuilding,
  FaClock,
  FaSignInAlt,
  FaSignOutAlt,
  FaPlayCircle,
  FaStopCircle
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = localStorage.getItem("username") || "User";
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    employees: 0,
    shifts: 0,
    reports: 0,
    departments: 0,
  });

  // Clock In/Out state
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [workDuration, setWorkDuration] = useState("00:00:00");
  const [canClockIn, setCanClockIn] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    // Update clock every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    checkUserRole();
    fetchDashboardStats();
    checkClockStatus();
  }, []);

  useEffect(() => {
    // Update work duration every second if clocked in
    if (isClockedIn && clockInTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = now - new Date(clockInTime);
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setWorkDuration(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isClockedIn, clockInTime]);

  const checkUserRole = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get('http://127.0.0.1:8000/api/user/profile/', {
        headers: { 'Authorization': `Token ${token}` }
      });

      const { is_staff, is_superuser, user_type } = response.data;
      setUserRole(user_type || (is_staff ? "Admin" : "User"));

      // Only non-admin, non-staff can clock in
      if (!is_staff && !is_superuser && user_type !== "Admin") {
        setCanClockIn(true);
      }
    } catch (err) {
      console.error("Error checking role:", err);
    }
  };

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      // Fetch stats from your APIs
      const [employeesRes, shiftsRes, reportsRes, deptsRes] = await Promise.allSettled([
        axios.get('http://127.0.0.1:8000/api/employees/', { headers: { 'Authorization': `Token ${token}` } }),
        axios.get('http://127.0.0.1:8000/api/shifts/', { headers: { 'Authorization': `Token ${token}` } }),
        axios.get('http://127.0.0.1:8000/api/reports/', { headers: { 'Authorization': `Token ${token}` } }),
        axios.get('http://127.0.0.1:8000/api/departments/', { headers: { 'Authorization': `Token ${token}` } }),
      ]);

      setStats({
        employees: employeesRes.status === 'fulfilled' ? (employeesRes.value.data.results?.length || employeesRes.value.data.length || 0) : 0,
        shifts: shiftsRes.status === 'fulfilled' ? (shiftsRes.value.data.results?.length || shiftsRes.value.data.length || 0) : 0,
        reports: reportsRes.status === 'fulfilled' ? (reportsRes.value.data.results?.length || reportsRes.value.data.length || 0) : 0,
        departments: deptsRes.status === 'fulfilled' ? (deptsRes.value.data.results?.length || deptsRes.value.data.length || 0) : 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkClockStatus = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      // Check if user is currently clocked in
      const response = await axios.get('http://127.0.0.1:8000/api/attendance/status/', {
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.data.is_clocked_in) {
        setIsClockedIn(true);
        setClockInTime(response.data.clock_in_time);
      }
    } catch (err) {
      console.error("Error checking clock status:", err);
    }
  };

  const handleClockIn = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      const response = await axios.post(
        'http://127.0.0.1:8000/api/attendance/clock-in/',
        {},
        { headers: { 'Authorization': `Token ${token}` } }
      );

      setIsClockedIn(true);
      setClockInTime(response.data.clock_in_time || new Date().toISOString());
      alert('✅ Clocked in successfully!');
    } catch (err) {
      console.error("Clock in error:", err);
      alert(err.response?.data?.detail || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      const response = await axios.post(
        'http://127.0.0.1:8000/api/attendance/clock-out/',
        {},
        { headers: { 'Authorization': `Token ${token}` } }
      );

      setIsClockedIn(false);
      setClockInTime(null);
      alert(`✅ Clocked out successfully! Total time: ${workDuration}`);
      setWorkDuration("00:00:00");
    } catch (err) {
      console.error("Clock out error:", err);
      alert(err.response?.data?.detail || 'Failed to clock out');
    }
  };

  const modules = [
    {
      title: "Employees",
      value: stats.employees.toString(),
      icon: <FaUsers />,
      route: "/employees",
      color: "bg-blue-500",
    },
    {
      title: "Shifts",
      value: stats.shifts.toString(),
      icon: <FaCalendarCheck />,
      route: "/shifts",
      color: "bg-green-500",
    },
    {
      title: "Reports",
      value: stats.reports.toString(),
      icon: <FaFileAlt />,
      route: "/reports",
      color: "bg-purple-500",
    },
    {
      title: "Departments",
      value: stats.departments.toString(),
      icon: <FaBuilding />,
      route: "/departments",
      color: "bg-orange-500",
    },
  ];

  if (loading) {
    return <Loader fullPage message="Loading dashboard..." />;
  }

  return (
    <div className="flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar title="Dashboard" user={user} />

        <main className="p-6 flex-1">
          {/* Welcome Section with Clock */}
          <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user}! 👋</h1>
                <p className="text-indigo-100">Here's your workspace overview</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-indigo-100">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          {/* Clock In/Out Widget - Only for non-admins */}
          {canClockIn && (
            <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center mb-2">
                    <FaClock className="mr-2 text-indigo-600" />
                    Time Tracking
                  </h2>
                  <p className="text-gray-600 text-sm">Track your working hours</p>
                </div>

                {isClockedIn ? (
                  <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                    {/* Active Timer Display */}
                    <div className="bg-green-50 border-2 border-green-500 rounded-lg px-6 py-4 text-center">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-700 font-semibold text-sm">CLOCKED IN</span>
                      </div>
                      <div className="text-3xl font-bold text-green-700 font-mono">
                        {workDuration}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Since {new Date(clockInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Clock Out Button */}
                    <button
                      onClick={handleClockOut}
                      className="flex items-center space-x-2 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition shadow-md hover:shadow-lg"
                    >
                      <FaStopCircle className="text-xl" />
                      <span className="font-semibold">Clock Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleClockIn}
                    className="flex items-center space-x-2 bg-green-500 text-white px-8 py-4 rounded-lg hover:bg-green-600 transition shadow-md hover:shadow-lg"
                  >
                    <FaPlayCircle className="text-2xl" />
                    <span className="font-semibold text-lg">Clock In</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {modules.map((mod, idx) => (
              <DashboardCard
                key={idx}
                title={mod.title}
                value={mod.value}
                icon={mod.icon}
                color={mod.color}
                onClick={() => navigate(mod.route)}
              />
            ))}
          </div>

          {/* Quick Info Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Your Role</p>
                <p className="text-lg font-semibold text-gray-800">{userRole}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold text-gray-800">
                  {isClockedIn ? '🟢 Active' : '⚪ Inactive'}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}