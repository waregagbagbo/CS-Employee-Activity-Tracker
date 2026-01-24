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
  FaThLarge,
  FaListUl,
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
  const [viewMode, setViewMode] = useState("grid");

  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees(page);
  }, [page]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = employees.filter((emp) => {
        const username = emp.username || "";
        const email = emp.email || "";
        const deptTitle = emp.title || "";
        const searchLower = searchTerm.toLowerCase();

        return (
          username.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower) ||
          deptTitle.toLowerCase().includes(searchLower)
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
      let employeeData = [];
      if (response.data.results) {
        employeeData = response.data.results;
        setNextPage(response.data.next);
        setPrevPage(response.data.previous);
      } else if (Array.isArray(response.data)) {
        employeeData = response.data;
      }
      setEmployees(employeeData);
    } catch (err) {
      setError(err.response?.data?.detail || "FAILED TO SYNCHRONIZE DIRECTORY.");
    } finally {
      setLoading(false);
    }
  };

  const getUsername = (emp) => emp.username || `User #${emp.user}` || "Unknown";
  const getEmail = (emp) => emp.email || "No email registered";
  const getDepartmentName = (emp) => {
    if (emp.department && typeof emp.department === 'object') {
      return emp.department.title || "General Node";
    }
    //return emp.department_name || "General Node";
  };

  const getInitials = (emp) => {
    const username = getUsername(emp);
    return username.substring(0, 2).toUpperCase();
  };

  const handlePrev = () => prevPage && setPage(page - 1);
  const handleNext = () => nextPage && setPage(page + 1);

  if (loading) return <Loader fullPage message="SCANNING DIRECTORY NODES..." />;

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 lg:p-12 max-w-7xl mx-auto">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-1 bg-[#FFCC00]"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Network Infrastructure</span>
              </div>
              <h1 className="text-5xl font-black italic uppercase tracking-tighter text-black">
                Personnel <span className="text-[#FF8800]">Directory</span>
              </h1>
              <p className="text-gray-500 text-xs font-bold mt-2 uppercase tracking-widest">
                Active System Nodes: <span className="text-black">{employees.length}</span>
              </p>
            </div>

            <button
              onClick={() => navigate("/employees/new")}
              className="bg-black text-[#FFCC00] px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-black/10 hover:bg-[#FFCC00] hover:text-black transition-all flex items-center gap-3 group"
            >
              <FaPlus className="group-hover:rotate-90 transition-transform" /> Add Personnel
            </button>
          </div>

          {/* Search & Utility Bar */}
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-4 mb-10 border border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative group">
                <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FFCC00] transition-colors" />
                <input
                  type="text"
                  placeholder="SEARCH BY HANDLE, EMAIL, OR NODE..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-16 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-2 focus:ring-[#FFCC00] transition-all outline-none font-bold text-xs uppercase tracking-widest"
                />
              </div>

              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-[1.5rem]">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 rounded-xl transition-all ${viewMode === "grid" ? "bg-black text-[#FFCC00] shadow-lg" : "text-gray-400 hover:text-black"}`}
                >
                  <FaThLarge />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-3 rounded-xl transition-all ${viewMode === "list" ? "bg-black text-[#FFCC00] shadow-lg" : "text-gray-400 hover:text-black"}`}
                >
                  <FaListUl />
                </button>
              </div>

              <button className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-black rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-[#FFCC00] transition-all">
                <FaFilter /> Filters
              </button>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-[#FFCC00] text-xl font-black italic shadow-xl group-hover:scale-110 transition-transform">
                      {getInitials(emp)}
                    </div>
                    <div className="px-3 py-1 bg-gray-50 rounded-lg text-[8px] font-black text-gray-400 uppercase tracking-widest group-hover:bg-[#FFCC00] group-hover:text-black transition-colors">
                      ID: #{emp.id}
                    </div>
                  </div>

                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-black mb-1 group-hover:text-[#FF8800] transition-colors">
                    {getUsername(emp)}
                  </h3>
                  <p className="text-[10px] font-black text-[#FFCC00] uppercase tracking-widest mb-6">
                    {getDepartmentName(emp)}
                  </p>

                  <div className="space-y-3 border-t border-gray-50 pt-6">
                    <div className="flex items-center gap-3 text-gray-500">
                      <FaEnvelope className="text-[10px]" />
                      <span className="text-[11px] font-bold truncate">{getEmail(emp)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                      <FaBuilding className="text-[10px]" />
                      <span className="text-[11px] font-bold uppercase">{getDepartmentName(emp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden mb-12">
              <table className="w-full text-left">
                <thead className="bg-black text-[#FFCC00]">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Personnel Handle</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] hidden md:table-cell">Security Email</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] hidden lg:table-cell">Operational Dept</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-bold">
                  {filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => navigate(`/employees/${emp.id}`)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-black font-black text-xs group-hover:bg-[#FFCC00]">
                            {getInitials(emp)}
                          </div>
                          <span className="text-sm uppercase tracking-tight text-black">{getUsername(emp)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-400 hidden md:table-cell">{getEmail(emp)}</td>
                      <td className="px-8 py-6 hidden lg:table-cell">
                        <span className="px-4 py-1 bg-gray-100 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:bg-black group-hover:text-white transition-all">
                          {getDepartmentName(emp)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="text-[10px] font-black uppercase tracking-widest text-[#FF8800] group-hover:translate-x-1 transition-transform inline-block">
                          View Node →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between bg-black p-6 rounded-[2rem] shadow-2xl">
            <button
              onClick={handlePrev}
              disabled={!prevPage}
              className="flex items-center gap-3 px-6 py-3 text-[#FFCC00] disabled:opacity-20 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 rounded-xl transition-all"
            >
              <FaChevronLeft /> Prev Segment
            </button>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Index Segment</span>
              <span className="w-10 h-10 bg-[#FFCC00] rounded-xl flex items-center justify-center text-black font-black text-xs shadow-lg shadow-[#FFCC00]/20 italic">
                {page}
              </span>
            </div>
            <button
              onClick={handleNext}
              disabled={!nextPage}
              className="flex items-center gap-3 px-6 py-3 text-[#FFCC00] disabled:opacity-20 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 rounded-xl transition-all"
            >
              Next Segment <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}