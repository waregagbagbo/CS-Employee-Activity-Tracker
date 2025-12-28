import React, { useState, useEffect } from "react";
import { FaBell, FaSearch, FaUser, FaCog, FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";

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

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) { setLoading(false); return; }

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
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
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

  return (
    <div className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-50">

      {/* Left Section: Title & Search */}
      <div className="flex items-center space-x-10 flex-1">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-black">
          {title}
        </h1>

        {/* Branded Search Bar */}
        <div className="hidden md:flex items-center bg-gray-50 border border-gray-100 rounded-2xl px-5 py-2.5 max-w-md w-full focus-within:border-[#FFCC00] focus-within:ring-1 focus-within:ring-[#FFCC00] transition-all">
          <FaSearch className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search records..."
            className="bg-transparent outline-none text-[11px] font-bold uppercase tracking-widest text-black w-full placeholder-gray-400"
          />
          <kbd className="hidden lg:inline-block px-2 py-1 text-[9px] font-black text-gray-400 bg-white border border-gray-200 rounded-md">
            CTRL + K
          </kbd>
        </div>
      </div>

      {/* Right Section: Actions & Profile */}
      <div className="flex items-center space-x-2">

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="relative p-3 text-black hover:bg-gray-50 rounded-xl transition-all"
          >
            <FaBell className="text-lg" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-black border-2 border-white text-[#FFCC00] text-[8px] font-black rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden ring-1 ring-black/5">
              <div className="bg-black px-6 py-5 text-white">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#FFCC00]">Alerts</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className="px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition">
                    <div className="flex items-start space-x-3">
                      {notif.unread && <div className="w-2 h-2 bg-[#FFCC00] rounded-full mt-1.5 flex-shrink-0" />}
                      <div className="flex-1">
                        <p className={`text-xs ${notif.unread ? "font-black text-black" : "font-medium text-gray-500"}`}>
                          {notif.text}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-black hover:bg-[#FFCC00] transition-colors">
                View All Operations
              </button>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <button onClick={() => navigate("/settings")}
                className="p-3 text-black hover:bg-gray-50 rounded-xl transition-all">
          <FaCog className="text-lg" />
        </button>

        <div className="h-6 w-px bg-gray-200 mx-2"></div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center space-x-3 pl-2 pr-1 py-1 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all border border-gray-100"
          >
            <div className="hidden lg:block text-right pr-1">
              <p className="text-[10px] font-black text-black uppercase tracking-tighter">
                {loading ? "..." : user.username}
              </p>
              <p className="text-[8px] text-[#FFCC00] font-black uppercase tracking-[0.1em]">Verified</p>
            </div>
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-[#FFCC00] font-black text-sm shadow-lg">
              {loading ? "" : user.username.charAt(0).toUpperCase()}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-4 w-60 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden ring-1 ring-black/5">
              <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/50">
                <p className="text-xs font-black text-black uppercase tracking-widest">{user.username}</p>
                <p className="text-[10px] text-gray-400 font-bold truncate mt-0.5">{user.email || "System User"}</p>
              </div>
              <div className="py-2 px-2">
                <button
                  onClick={() => navigate(`/employees/${employeeId}/`)}
                  className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-black hover:bg-[#FFCC00] rounded-2xl flex items-center space-x-3 transition-all"
                >
                  <FaUser size={12} />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => navigate("/settings")}
                  className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-black hover:bg-[#FFCC00] rounded-2xl flex items-center space-x-3 transition-all"
                >
                  <FaCog size={12} />
                  <span>Account Settings</span>
                </button>
              </div>
              <div className="p-2 border-t border-gray-100">
                <button
                  onClick={() => navigate("/logout")}
                  className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white bg-black hover:bg-rose-600 rounded-2xl flex items-center space-x-3 transition-all"
                >
                  <FaSignOutAlt size={12} className="text-[#FFCC00]" />
                  <span>Terminate Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}