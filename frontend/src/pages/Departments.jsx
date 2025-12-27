import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { listDepartments } from "../services/department";
import {
  FaBuilding,
  FaSearch,
  FaPlus,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaEye,
  FaLock,
  FaUserTie,
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

  // User permissions
  const [userRole, setUserRole] = useState("");
  const [canCreateDepartments, setCanCreateDepartments] = useState(false);
  const [canEditDepartments, setCanEditDepartments] = useState(false);
  const [canDeleteDepartments, setCanDeleteDepartments] = useState(false);

  useEffect(() => {
    checkUserPermissions();
    fetchDepartments();
  }, []);

  useEffect(() => {
    // Filter departments based on search term
    if (searchTerm) {
      const filtered = departments.filter((dept) => {
        const name = dept.name || dept.title || "";
        const description = dept.description || "";
        const head = dept.department_head || dept.head || "";

        const searchLower = searchTerm.toLowerCase();

        return (
          name.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower) ||
          head.toLowerCase().includes(searchLower)
        );
      });
      setFilteredDepartments(filtered);
    } else {
      setFilteredDepartments(departments);
    }
  }, [searchTerm, departments]);

  const checkUserPermissions = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      if (!token) return;

      const response = await fetch('http://127.0.0.1:8000/api/employees/me', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        const { is_staff, is_superuser, user_type } = userData;

        setUserRole(user_type || (is_staff ? "Staff" : "User"));

        // Only Admins can manage departments
        if (is_staff || is_superuser || user_type === "Admin") {
          setCanCreateDepartments(true);
          setCanEditDepartments(true);
          setCanDeleteDepartments(true);
        } else {
          setCanCreateDepartments(false);
          setCanEditDepartments(false);
          setCanDeleteDepartments(false);
        }

        console.log("Department permissions:", { user_type, canManage: is_staff || user_type === "Admin" });
      }
    } catch (err) {
      console.error("Error checking permissions:", err);
    }
  };

  const fetchDepartments = async (pageNumber = 1) => {
    setLoading(true);
    setError("");

    try {
      // Use your API service
      const response = await listDepartments({ page: pageNumber });

      console.log("Departments response:", response.data);

      // Handle different response structures
      let deptData = [];

      if (response.data.results) {
        // Paginated response
        deptData = response.data.results;
        setNextPage(response.data.next);
        setPrevPage(response.data.previous);
      } else if (Array.isArray(response.data)) {
        // Direct array
        deptData = response.data;
        setNextPage(null);
        setPrevPage(null);
      }

      console.log("Departments loaded:", deptData.length);
      setDepartments(deptData);

    } catch (err) {
      console.error("Departments fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to safely get field values
  const getDeptName = (dept) => {
    return dept?.name || dept?.title || dept?.department_name || "Unnamed Department";
  };

  const getDeptDescription = (dept) => {
    return dept?.description || "No description available";
  };

  const getDeptHead = (dept) => {
    return dept?.department_head || dept?.head || dept?.manager || "Not assigned";
  };

  const getDeptEmployeeCount = (dept) => {
    return dept?.employee_count|| dept?.employees?.length || dept?.total_employees || 0;
  };

  const handlePrev = () => {
    if (prevPage) {
      setPage(page - 1);
      fetchDepartments(page - 1);
    }
  };

  const handleNext = () => {
    if (nextPage) {
      setPage(page + 1);
      fetchDepartments(page + 1);
    }
  };

  if (loading) {
    return <Loader fullPage message="Loading departments..." />;
  }

  return (
    <div className="flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <div className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div className="mb-4 md:mb-0">
                  <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <FaBuilding className="mr-3 text-indigo-600" />
                    Departments
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage organizational departments ({departments.length} total)
                  </p>
                  {userRole && (
                    <p className="text-sm mt-1 flex items-center">
                      <span className="font-medium text-gray-700">Role: {userRole}</span>
                      {!canCreateDepartments && (
                        <span className="ml-2 text-orange-600 flex items-center">
                          <FaLock className="mr-1" />
                          View-only access
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Add Department Button */}
                {canCreateDepartments ? (
                  <button
                    onClick={() => navigate("/departments/new")}
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition shadow-md hover:shadow-lg"
                  >
                    <FaPlus />
                    <span className="font-medium">Add Department</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex items-center space-x-2 bg-gray-300 text-gray-500 px-6 py-3 rounded-lg cursor-not-allowed opacity-60"
                    title="Only administrators can add departments"
                  >
                    <FaLock />
                    <span className="font-medium">Add Department</span>
                  </button>
                )}
              </div>

              {/* Success/Error Messages */}
              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start">
                  <FaBuilding className="mr-2 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                  <FaLock className="mr-2 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Search and View Toggle */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, description, or head..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-4 py-2 rounded-lg transition ${
                        viewMode === "grid"
                          ? "bg-white shadow-md text-indigo-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-4 py-2 rounded-lg transition ${
                        viewMode === "list"
                          ? "bg-white shadow-md text-indigo-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* No Results */}
            {filteredDepartments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaBuilding className="text-gray-400 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Departments Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? `No results for "${searchTerm}"`
                    : "Start by adding your first department"}
                </p>
                {canCreateDepartments && !searchTerm && (
                  <button
                    onClick={() => navigate("/departments/new")}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Add First Department
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {filteredDepartments.map((dept) => (
                      <div
                        key={dept.id}
                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                        onClick={() => navigate(`/departments/${dept.id}`)}
                      >
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-6">
                          <div className="flex items-center justify-between">
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                              <FaBuilding className="text-indigo-600 text-2xl" />
                            </div>
                          </div>
                          <h3 className="text-xl font-bold text-white mt-4 group-hover:text-indigo-100 transition">
                            {getDeptName(dept)}
                          </h3>
                        </div>

                        {/* Card Content */}
                        <div className="px-6 py-4">
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {getDeptDescription(dept)}
                          </p>

                          <div className="space-y-3 text-sm">
                            <div className="flex items-center text-gray-600">
                              <FaUserTie className="mr-2 text-indigo-500" />
                              <span className="font-medium">Head: </span>
                              <span className="ml-1">{getDeptHead(dept)}</span>
                            </div>

                            <div className="flex items-center text-gray-600">
                              <FaUsers className="mr-2 text-indigo-500" />
                              <span className="font-medium">Employees: </span>
                              <span className="ml-1">{getDeptEmployeeCount(dept)}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-4 pt-4 border-t border-gray-100 flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/departments/${dept.id}`);
                              }}
                              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-sm"
                            >
                              <FaEye />
                              <span>View</span>
                            </button>

                            {canEditDepartments ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/departments/${dept.id}/edit`);
                                }}
                                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm"
                              >
                                <FaEdit />
                                <span>Edit</span>
                              </button>
                            ) : (
                              <button
                                disabled
                                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-sm"
                              >
                                <FaLock />
                                <span>Edit</span>
                              </button>
                            )}

                            {canDeleteDepartments && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* List View */}
                {viewMode === "list" && (
                  <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                            Department
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">
                            Head
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">
                            Employees
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredDepartments.map((dept) => (
                          <tr
                            key={dept.id}
                            className="hover:bg-gray-50 transition cursor-pointer"
                            onClick={() => navigate(`/departments/${dept.id}`)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                                  <FaBuilding />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">{getDeptName(dept)}</p>
                                  <p className="text-sm text-gray-500 line-clamp-1">{getDeptDescription(dept)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600 hidden md:table-cell">
                              {getDeptHead(dept)}
                            </td>
                            <td className="px-6 py-4 hidden lg:table-cell">
                              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                                {getDeptEmployeeCount(dept)} employees
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/departments/${dept.id}`);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-700"
                                  title="View details"
                                >
                                  <FaEye />
                                </button>

                                {canEditDepartments ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/departments/${dept.id}/edit`);
                                    }}
                                    className="text-blue-600 hover:text-blue-700"
                                    title="Edit department"
                                  >
                                    <FaEdit />
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="text-gray-300 cursor-not-allowed"
                                    title="You don't have permission"
                                  >
                                    <FaLock />
                                  </button>
                                )}

                                {canDeleteDepartments && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                    title="Delete department"
                                  >
                                    <FaTrash />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {(nextPage || prevPage) && (
                  <div className="bg-white rounded-xl shadow-md p-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={handlePrev}
                        disabled={!prevPage}
                        className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaChevronLeft />
                        <span className="font-medium">Previous</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Page</span>
                        <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-semibold">
                          {page}
                        </span>
                      </div>

                      <button
                        onClick={handleNext}
                        disabled={!nextPage}
                        className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="font-medium">Next</span>
                        <FaChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}