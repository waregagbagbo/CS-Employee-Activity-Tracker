import React from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import DashboardCard from "../components/DashboardCard";
import { FaUsers, FaClipboardList, FaFileAlt, FaAppleAlt, FaCalendarCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const modules = [
    { title: "Employees", value: "120", icon: <FaUsers />, route: "/employees" },
    { title: "Activities", value: "35", icon: <FaClipboardList />, route: "/activities" },
    { title: "Reports", value: "12", icon: <FaFileAlt />, route: "/reports" },
    { title: "Health & Nutrition", value: "50", icon: <FaAppleAlt />, route: "/nutrition" },
    { title: "Attendance", value: "95%", icon: <FaCalendarCheck />, route: "/attendance" },
  ];

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar title="Dashboard" />

        <main className="p-6 bg-gray-100 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, index) => (
              <DashboardCard
                key={index}
                title={mod.title}
                value={mod.value}
                icon={mod.icon}
                onClick={() => navigate(mod.route)}
              />
            ))}
          </div>

          {/* Future Charts / Tables */}
          <div className="mt-6 bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500">Select a module to view detailed data.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
