import React, { useState, useContext } from "react"; // Added useContext
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // Added AuthContext import
import {
  FaTachometerAlt,
  FaUsers,
  FaCalendarAlt,
  FaFileAlt,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaBuilding,
  FaPlus,     // Added for New Report
  FaChartBar  // Added for Analytics
} from "react-icons/fa";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userType, logout } = useContext(AuthContext); // Destructured userType and logout from Context
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fixed: Fallback changed from "user" to "username" to match your auth.js configuration
  const username = localStorage.getItem("username") || "User";
  const isSupervisor = userType === "supervisor";

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: <FaTachometerAlt />, visible: true },
    { name: "New Report", path: "/new-report", icon: <FaPlus />, visible: !isSupervisor }, // Employees only
    { name: "Analytics", path: "/analytics", icon: <FaChartBar />, visible: isSupervisor },   // Supervisors only
    { name: "Employees", path: "/employees", icon: <FaUsers />, visible: true },
    { name: "Shifts", path: "/shifts", icon: <FaCalendarAlt />, visible: true },
    { name: "Reports", path: "/reports", icon: <FaFileAlt />, visible: true },
    { name: "Departments", path: "/departments", icon: <FaBuilding />, visible: true },
  ];

  // Filter links based on visibility parameter rules
  const visibleLinks = navLinks.filter(link => link.visible);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout(); // Changed to utilize your central Context layout setup
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">ET</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-800">Employee Tracker</h1>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive(link.path)
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                <span className="text-sm font-medium">{link.name}</span>
              </Link>
            ))}
          </div>

          {/* Right Section - User & Logout */}
          <div className="hidden md:flex items-center space-x-4">
            {/* User Info */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 leading-tight">{username}</span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  {userType ? userType.replace("_", " ") : "Online"}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <FaSignOutAlt />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          >
            {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {visibleLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(link.path)
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span className="font-medium">{link.name}</span>
              </Link>
            ))}

            {/* Mobile User Info */}
            <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg mt-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{username}</p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  {userType ? userType.replace("_", " ") : "Online"}
                </p>
              </div>
            </div>

            {/* Mobile Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 mt-3"
            >
              <FaSignOutAlt />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
