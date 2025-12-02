import React from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import DashboardCard from "../components/DashboardCard";
import { FaUsers, FaClipboardList, FaFileAlt, FaAppleAlt, FaCalendarCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = localStorage.getItem("username") || "User";

  const modules = [
    { title: "Employees", value: "120", icon: <FaUsers />, route: "/employees" },
    { title: "Activities", value: "35", icon: <FaClipboardList />, route: "/activities" },
    { title: "Reports", value: "12", icon: <FaFileAlt />, route: "/reports" },
    { title: "Health & Nutrition", value: "50", icon: <FaAppleAlt />, route: "/nutrition" },
    { title: "Attendance", value: "95%", icon: <FaCalendarCheck />, route: "/attendance" },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar title="Dashboard" user={user} />

        <main className="p-6 bg-gray-100 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, idx) => (
              <DashboardCard
                key={idx}
                title={mod.title}
                value={mod.value}
                icon={mod.icon}
                onClick={() => navigate(mod.route)}
              />
            ))}
          </div>

          <div className="mt-6 bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500">Charts, tables, and module details will appear here.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
