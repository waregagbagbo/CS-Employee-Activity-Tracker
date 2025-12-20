import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import DashboardCard from "../components/DashboardCard";
import { FaUsers, FaClipboardList, FaFileAlt, FaAppleAlt, FaCalendarCheck, FaChartLine, FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {FaHouse, FaPeopleGroup} from "react-icons/fa6";

export default function Dashboard() {
  const navigate = useNavigate();
  //const username = localStorage.getItem("username");
  const user = localStorage.getItem("username");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const modules = [
    {
      title: "Employees",
      value: "120",
      icon: <FaUsers />,
      route: "/employees",
      color: "bg-blue-500",
      trend: "+12%",
      trendUp: true
    },
    {
      title: "Shifts",
      value: "95%",
      icon: <FaCalendarCheck />,
      route: "/shifts",
      color: "bg-green-500",
      trend: "+5%",
      trendUp: true
    },
    {
      title: "Reports",
      value: "12",
      icon: <FaFileAlt />,
      route: "/reports",
      color: "bg-purple-500",
      trend: "3 new",
      trendUp: true
    },
    {
      title: "Departments",
      value: "50",
      icon: <FaPeopleGroup />,
      route: "/departments",
      color: "bg-orange-500",
      trend: "+2",
      trendUp: true
    },
    {
      title: "Attendance",
      value: "95%",
      icon: <FaCalendarCheck />,
      route: "/attendance",
      color: "bg-teal-500",
      trend: "-2%",
      trendUp: false
    },
  ];

  const recentActivities = [
    { user: "John Doe", action: "clocked in", time: "2 mins ago", type: "success" },
    { user: "Jane Smith", action: "submitted report", time: "15 mins ago", type: "info" },
    { user: "Mike Johnson", action: "requested leave", time: "1 hour ago", type: "warning" },
    { user: "Sarah Williams", action: "updated profile", time: "2 hours ago", type: "info" },
  ];

  const upcomingEvents = [
    { title: "Team Meeting", time: "10:00 AM", date: "Today" },
    { title: "Performance Review", time: "2:00 PM", date: "Today" },
    { title: "Training Session", time: "9:00 AM", date: "Tomorrow" },
  ];

  return (
    <div className="flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar title="Enterprise Support" user={user} />

        <main className="p-6 flex-1">
          {/* Welcome Section */}
          <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user}! 👋</h1>
                <p className="text-indigo-100">Here's what's happening with your department today.</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-indigo-100">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
            {modules.map((mod, idx) => (
              <DashboardCard
                key={idx}
                title={mod.title}
                value={mod.value}
                icon={mod.icon}
                color={mod.color}
                trend={mod.trend}
                trendUp={mod.trendUp}
                onClick={() => navigate(mod.route)}
              />
            ))}
          </div>

          {/* Charts and Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Quick Stats Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FaChartLine className="mr-2 text-indigo-600" />
                  Performance Overview
                </h2>
                <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                </select>
              </div>

              {/* Simple Chart Placeholder */}
              <div className="h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex items-center justify-center border border-indigo-100">
                <div className="text-center">
                  <FaChartLine className="text-6xl text-indigo-300 mx-auto mb-3" />
                  <p className="text-gray-500">Chart visualization will appear here</p>
                  <p className="text-sm text-gray-400 mt-1">Connect your analytics data to see insights</p>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">87%</p>
                  <p className="text-xs text-gray-600">Attendance Rate</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">42hrs</p>
                  <p className="text-xs text-gray-600">Avg Work Hours</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">98%</p>
                  <p className="text-xs text-gray-600">Shift Coverage</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaClock className="mr-2 text-indigo-600" />
                Recent Activity
              </h2>
              <div className="space-y-4">
                {recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View All Activity →
              </button>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Events */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Events</h2>
              <div className="space-y-3">
                {upcomingEvents.map((event, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <FaCalendarCheck className="text-indigo-600 text-xl" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{event.title}</p>
                        <p className="text-sm text-gray-500">{event.date} at {event.time}</p>
                      </div>
                    </div>
                    <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      Details →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-md">
                  <FaUsers className="text-2xl mb-2" />
                  <p className="text-sm font-medium">Add Employee</p>
                </button>
                <button className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition shadow-md">
                  <FaCalendarCheck className="text-2xl mb-2" />
                  <p className="text-sm font-medium">Create Shift</p>
                </button>
                <button className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition shadow-md">
                  <FaFileAlt className="text-2xl mb-2" />
                  <p className="text-sm font-medium">Generate Report</p>
                </button>
                <button className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition shadow-md">
                  <FaAppleAlt className="text-2xl mb-2" />
                  <p className="text-sm font-medium">Manage Depts</p>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}