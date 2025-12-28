import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { listDepartments } from "../services/department";
import {
  FaBuilding, FaSearch, FaPlus, FaUsers, FaChevronLeft,
  FaChevronRight, FaEdit, FaTrash, FaEye, FaLock, FaUserTie, FaShieldAlt
} from "react-icons/fa";

export default function Departments() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const init = async () => {
      await checkUserPermissions();
      await fetchDepartments();
    };
    init();
  }, []);

  useEffect(() => {
    const filtered = departments.filter((dept) => {
      const title = dept.name || dept.title || "";
      const desc = dept.description || "";
      return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             desc.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredDepartments(filtered);
  }, [searchTerm, departments]);

  const checkUserPermissions = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) return;
      const response = await fetch('http://127.0.0.1:8000/api/employees/me/', {
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        const isAdmin = data.is_staff || data.is_superuser || ["Admin", "superuser", "admin"].includes(data.user_type);
        setCanManage(isAdmin);
        setUserRole(data.user_type || (isAdmin ? "Administrator" : "Employee"));
      }
    } catch (err) { console.error("Permission check error:", err); }
  };

  const fetchDepartments = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const response = await listDepartments({ page: pageNumber });
      const deptData = response.data.results || response.data;
      setDepartments(Array.isArray(deptData) ? deptData : []);
    } catch (err) { setError("Failed to load departments"); }
    finally { setLoading(false); }
  };

  if (loading) return <Loader fullPage message="SYNCHRONIZING DIRECTORY..." />;

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen font-sans">
      <Sidebar />
      <div className="flex-1 p-8 lg:p-12">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-black flex items-center">
              Node <span className="text-[#FFCC00] ml-2">Directory</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
              <FaShieldAlt className="text-[#FFCC00]" /> Access Tier: {userRole}
            </p>
          </div>

          {canManage ? (
            <button
              onClick={() => navigate("/departments/new")}
              className="bg-black text-[#FFCC00] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3"
            >
              <FaPlus /> Add Department
            </button>
          ) : (
            <div className="bg-gray-100 border border-gray-200 px-6 py-3 rounded-2xl flex items-center gap-3">
              <FaLock className="text-gray-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Read-Only Directory</span>
            </div>
          )}
        </header>

        {/* Search Bar */}
        <div className="relative mb-10 group">
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FFCC00] transition-colors" />
          <input
            type="text"
            placeholder="FILTER BY DEPARTMENT NAME OR DESCRIPTION..."
            className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFCC00] text-xs font-bold uppercase tracking-widest transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDepartments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group"
            >
              {/* Abstract Background Icon */}
              <FaBuilding className="absolute -right-4 -bottom-4 text-gray-50 text-8xl group-hover:text-[#FFCC00]/10 transition-colors" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-black p-4 rounded-2xl text-[#FFCC00]">
                    <FaBuilding size={20} />
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg">
                    <FaUsers className="text-gray-400" size={12} />
                    <span className="text-[10px] font-black text-black uppercase">
                      {dept.employee_count || 0} Staff
                    </span>
                  </div>
                </div>

                <h3 className="font-black text-xl uppercase tracking-tight text-black mb-2 truncate">
                  {dept.name || dept.title}
                </h3>
                <p className="text-xs text-gray-400 font-medium line-clamp-2 mb-8 uppercase tracking-tighter leading-relaxed">
                  {dept.description || "Operational unit with no secondary description recorded."}
                </p>

                <div className="flex items-center gap-3 mb-8 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 bg-[#FFCC00] rounded-lg flex items-center justify-center text-black font-black text-xs">
                    <FaUserTie />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Head of Node</p>
                    <p className="text-[10px] font-black text-black uppercase">{dept.department_head || "UNASSIGNED"}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-50">
                  <button
                    onClick={() => navigate(`/departments/${dept.id}`)}
                    className="flex-1 bg-gray-100 text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-[#FFCC00] transition-all"
                  >
                    <FaEye className="inline mr-2" /> View
                  </button>

                  {canManage ? (
                    <>
                      <button
                        onClick={() => navigate(`/departments/${dept.id}/edit`)}
                        className="p-3 bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-600 rounded-xl transition-all"
                      >
                        <FaEdit />
                      </button>
                      <button className="p-3 bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-600 rounded-xl transition-all">
                        <FaTrash />
                      </button>
                    </>
                  ) : (
                    <div className="p-3 text-gray-200 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100">
                      <FaLock size={12} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDepartments.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200 mt-10">
            <FaBuilding className="mx-auto text-gray-100 text-6xl mb-4" />
            <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-xs">No matching nodes found in directory</p>
          </div>
        )}
      </div>
    </div>
  );
}