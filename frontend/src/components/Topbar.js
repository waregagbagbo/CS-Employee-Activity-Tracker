import React, { useState, useEffect } from "react";
import { FaBell, FaSearch, FaUser, FaCog, FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import {useNavigate} from "react-router-dom";
import {Link} from "react-router-dom";


export default function Topbar({ title }) {
  const navigate = useNavigate();
  const employeeId = localStorage.getItem("employee_id");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState({
    username: localStorage.getItem("username") || "User",
    email: localStorage.getItem("email") || ""
  });
  const [loading, setLoading] = useState(true);

  // Fetch user data when component mounts
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Try to get user info from your API
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/", {
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();

        const userData = {
          username: data.username || data.user?.username || localStorage.getItem("username"),
          email: data.email || data.user?.email || localStorage.getItem("email") || ""
        };

        setUser(userData);

        // Update localStorage for future use
        localStorage.setItem("username", userData.username);
        if (userData.email) {
          localStorage.setItem("email", userData.email);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Keep using localStorage data if API fails
    } finally {
      setLoading(false);
    }
  };

  const notifications = [
    { id: 1, text: "New employee registered", time: "5 mins ago", unread: true },
    { id: 2, text: "Report generated successfully", time: "1 hour ago", unread: true },
    { id: 3, text: "Shift schedule updated", time: "2 hours ago", unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = () => {
    navigate("/logout");
  };

  return (
    <div className="bg-white shadow-md px-6 py-4 flex justify-between items-center sticky top-0 z-50 border-b border-gray-200">
      {/* Left Section - Title & Search */}
      <div className="flex items-center space-x-6 flex-1">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>

        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-4 py-2 max-w-md w-full">
          <FaSearch className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search employees, reports..."
            className="bg-transparent outline-none text-sm text-gray-700 w-full"
          />
          <kbd className="hidden lg:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-white border border-gray-300 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Section - Icons & User */}
      <div className="flex items-center space-x-4">
        {/* Search Icon (Mobile) */}
        <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
          <FaSearch className="text-lg" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <FaBell className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white">
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-xs text-indigo-100">{unreadCount} unread messages</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${
                      notif.unread ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {notif.unread && (
                        <div className="w-2 h-2 bg-black-500 rounded-full mt-2 flex-shrink-0"></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notif.unread ? "font-semibold text-gray-800" : "text-gray-600"}`}>
                          {notif.text}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-gray-50 text-center">
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button onClick={() => navigate("/settings")}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">

          <FaCog className="text-xl" />
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300"></div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              {loading ? "..." : user.username.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-semibold text-gray-700">
                {loading ? "Loading..." : user.username}
              </p>
              <p className="text-xs text-gray-500"></p>
            </div>
            <FaChevronDown className="text-gray-400 text-xs hidden lg:block" />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-800">{user.username}</p>
                <p className="text-xs text-gray-500 truncate">{user.email || "No email"}</p>
              </div>
              <div className="py-2">
                <button
                  onClick={() => navigate(`/employees/${employeeId}/`)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3 transition"
                >
                  <FaUser className="text-gray-400" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => navigate("/settings")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3 transition"
                >
                  <FaCog className="text-gray-400" />
                  <span>Settings</span>
                </button>
              </div>

              <div className="border-t border-gray-100 py-2">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition"
                >
                  <FaSignOutAlt className="text-red-500" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}