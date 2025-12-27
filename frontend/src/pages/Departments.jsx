import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { listDepartments } from "../services/department";
import {
  FaBuilding, FaSearch, FaPlus, FaUsers, FaChevronLeft,
  FaChevronRight, FaEdit, FaTrash, FaEye, FaLock, FaUserTie,
} from "react-icons/fa";

export default function Departments() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [viewMode, setViewMode] = useState("list");

  // Permission States - matching your DepartmentViewPermission logic
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
      const searchLower = searchTerm.toLowerCase();
      return (
        (dept.title || "").toLowerCase().includes(searchLower) ||
        (dept.description || "").toLowerCase().includes(searchLower)
      );
    });
    setFilteredDepartments(filtered);
  }, [searchTerm, departments]);

  const checkUserPermissions = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://127.0.0.1:8000/api/employees/me/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Match your Backend: request.user.is_staff or request.user.is_superuser
        // Also checking user_type as a fallback
        const isAdmin = data.is_staff ||
                        data.is_superuser ||
                        data.user_type === "Admin" || "superuser" || 'admin'

        setCanManage(isAdmin);
        setUserRole(data.user_type || (isAdmin ? "Administrator" : "Employee"));
      }
    } catch (err) {
      console.error("Permission check error:", err);
    }
  };

  const fetchDepartments = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const response = await listDepartments({ page: pageNumber });
      const deptData = response.data.results || response.data;
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setNextPage(response.data.next);
      setPrevPage(response.data.previous);
    } catch (err) {
      setError("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullPage message="Verifying permissions..." />;

  return (
    <div className="flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <div className="py-8 px-4 max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <FaBuilding className="mr-3 text-indigo-600" /> Departments
              </h1>
              <p className="text-gray-600 mt-1">Role: <span className="font-bold text-indigo-600">{userRole}</span></p>
            </div>

            {/* CREATE BUTTON - Only for Admins */}
            {canManage ? (
              <button
                onClick={() => navigate("/departments/new")}
                className="mt-4 md:mt-0 flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition shadow-md"
              >
                <FaPlus /> <span>Add Department</span>
              </button>
            ) : (
              <div className="mt-4 md:mt-0 text-gray-400 flex items-center bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                <FaLock className="mr-2" /> <span className="text-sm">Read-Only Access</span>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Head</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Count</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-indigo-50/50 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{dept.name || dept.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">{dept.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{dept.department_head || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium">
                        {dept.employee_count || 0} Members
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => navigate(`/departments/${dept.id}`)}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition"
                          title="View"
                        >
                          <FaEye />
                        </button>

                        {/* EDIT & DELETE - Only for Admins */}
                        {canManage ? (
                          <>
                            <button
                              onClick={() => navigate(`/departments/${dept.id}/edit`)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-red-600 transition"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </>
                        ) : (
                          <div className="p-2 text-gray-200" title="Permission Denied">
                            <FaLock size={12} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination omitted for brevity but logic is preserved in your fetch function */}
        </div>
      </div>
    </div>
  );
}