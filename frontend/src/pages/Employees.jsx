import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listEmployees } from "../services/employee";
import Loader from "../components/Loader";
import Sidebar from "../components/Sidebar";
import {
  FaUsers,
  FaSearch,
  FaPlus,
  FaEnvelope,
  FaBuilding,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaUser,
} from "react-icons/fa";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [viewMode, setViewMode] = useState("list");

  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees(page);
  }, [page]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = employees.filter((emp) => {
        const username = emp.username || "";
        const email = emp.email || "";
        const deptTitle = emp.department?.title || "";
        const bio = emp.bio || "";
        const userType = emp.user_type || "";

        const searchLower = searchTerm.toLowerCase();

        return (
          username.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower) ||
          deptTitle.toLowerCase().includes(searchLower) ||
          bio.toLowerCase().includes(searchLower) ||
          userType.toLowerCase().includes(searchLower)
        );
      });
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchTerm, employees]);

  const fetchEmployees = async (pageNumber) => {
    setLoading(true);
    setError("");
    try {
      const response = await listEmployees({ page: pageNumber });

      console.log("API Response:", response.data);

      // Handle different response structures
      let employeeData = [];

      if (response.data.results) {
        employeeData = response.data.results;
        setNextPage(response.data.next);
        setPrevPage(response.data.previous);
      } else if (Array.isArray(response.data)) {
        employeeData = response.data;
      }

      console.log("Employees loaded:", employeeData.length);
      setEmployees(employeeData);

    } catch (err) {
      console.error("Employee fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get username (user is just an ID in your API)
  const getUsername = (emp) => {
    return emp.username || `User #${emp.user}` || "Unknown";
  };

  // Helper function to get email
  const getEmail = (emp) => {
    return emp.email || "No email provided";
  };

  // Helper function to get department name
  const getDepartmentName = (emp) => {
    // Your API returns department as object with 'title' field
    if (emp.department && typeof emp.department === 'object') {
      return emp.department.title || emp.department.name || "No department";
    }
    return emp.department_name || emp.department_title || "No department";
  };

  // Helper function to get initials
  const getInitials = (emp) => {
    const username = getUsername(emp);
    // Extract first 2 chars from username
    if (username.startsWith('User #')) {
      return 'U' + emp.user.toString().charAt(0);
    }
    return username.substring(0, 2).toUpperCase();
  };

  const handlePrev = () => prevPage && setPage(page - 1);
  const handleNext = () => nextPage && setPage(page + 1);

  if (loading) {
    return <Loader fullPage message="Loading employees..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUsers className="text-red-600 text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Employees</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchEmployees(page)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 min-h-screen">
          <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <FaUsers className="mr-3 text-indigo-600" />
                Employees
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your team members ({employees.length} total)
              </p>
            </div>

            <button
              onClick={() => navigate("/employees/new")}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition shadow-md hover:shadow-lg"
            >
              <FaPlus />
              <span className="font-medium">Add Employee</span>
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by username, email, or department..."
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

              {/* Filter Button */}
              <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <FaFilter className="text-gray-600" />
                <span className="text-gray-700">Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* No Results Message */}
        {filteredEmployees.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUsers className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Employees Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? `No results for "${searchTerm}"`
                : "Start by adding your first employee"}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm("")}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={() => navigate("/employees/new")}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Add First Employee
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                  >
                    {/* Card Header with Gradient */}
                    <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                      <div className="absolute -bottom-10 left-6">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                          <span className="text-2xl font-bold text-indigo-600">
                            {getInitials(emp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="pt-14 px-6 pb-6">
                      <div className="flex items-center space-x-2 mb-1">
                        <FaUser className="text-indigo-500 text-sm" />
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition">
                          {getUsername(emp)}
                        </h3>
                      </div>

                      <div className="space-y-2 text-sm mt-3">
                        <div className="flex items-center text-gray-600">
                          <FaEnvelope className="mr-2 text-indigo-500 flex-shrink-0" />
                          <span className="truncate">{getEmail(emp)}</span>
                        </div>

                        <div className="flex items-center text-gray-600">
                          <FaBuilding className="mr-2 text-indigo-500 flex-shrink-0" />
                          <span className="truncate">{getDepartmentName(emp)}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end">
                        <span className="text-indigo-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                          View Details →
                        </span>
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        className="hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => navigate(`/employees/${emp.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {getInitials(emp)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 flex items-center space-x-2">
                                <FaUser className="text-indigo-500 text-xs" />
                                <span>{getUsername(emp)}</span>
                              </p>
                              <p className="text-sm text-gray-500 md:hidden">{getEmail(emp)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 hidden md:table-cell">
                          {getEmail(emp)}
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                            {getDepartmentName(emp)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                            View →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {filteredEmployees.length > 0 && (
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
          </div>
        </div>
      </div>
    </div>
  );
}