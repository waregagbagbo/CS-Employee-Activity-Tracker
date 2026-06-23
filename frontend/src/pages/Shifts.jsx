import React, { useState, useEffect, useCallback, useRef } from "react";
import { CalendarRange, Search } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { ShiftService } from "../services/shifts";
import ShiftFeed from "../components/ShiftFeed";

export default function ShiftsPage() {
  const [activeTab, setActiveTab] = useState("today"); // 'today', 'upcoming', 'all'
  const [shifts, setShifts] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ hasNext: false, hasPrev: false });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const isFetchingRef = useRef(false);

  const username = localStorage.getItem("username") || "Agent";
  const userRole = localStorage.getItem("user_role") || "Employee";
  const isManagement = ["Supervisor", "Manager", "Admin"].includes(userRole);

  const loadShifts = useCallback(async (targetPage = 1, currentSearch = "") => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (activeTab === "today") {
        const data = await ShiftService.getTodayShifts();
        setShifts(data);
        setPagination({ hasNext: false, hasPrev: false });
      } else if (activeTab === "upcoming") {
        const data = await ShiftService.getUpcomingShifts();
        setShifts(data);
        setPagination({ hasNext: false, hasPrev: false });
      } else {
        // Tab is 'all' history layout
        const data = await ShiftService.getShifts(targetPage, currentSearch);
        setShifts(data.results);
        setPagination({ hasNext: data.hasNext, hasPrev: data.hasPrev });
        setPage(targetPage);
      }
    } catch (err) {
      console.error("Shift fetching pipeline integration error:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    loadShifts(1, searchQuery);
  }, [activeTab, loadShifts]);

  // Handle live query text searching with an execution callback
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (activeTab === "all") {
      loadShifts(1, value);
    }
  };

  return (
    <div className="flex bg-[#F9FAFB] h-screen w-full font-sans text-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Topbar title="Operations Schedule" user={username} />

        <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">

          {/* TOP CONTROLS DASHBOARD SHELL BAR */}
          <section className="bg-black p-6 rounded-[2.5rem] text-white flex justify-between items-center border-b-4 border-[#FFCC00]">
            <div className="flex items-center gap-3">
              <CalendarRange size={22} className="text-[#FFCC00]" />
              <h1 className="text-xl font-black uppercase tracking-tight text-white">
                Deployments Registry
              </h1>
            </div>
            <span className="text-[10px] font-mono bg-neutral-900 text-gray-400 px-3 py-1.5 rounded-xl uppercase tracking-wider border border-neutral-800 font-bold">
              Scope: {userRole}
            </span>
          </section>

          {/* VIEW TAB CONTROLS & DYNAMIC SEARCH BAR BAR */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 p-1 bg-gray-200/50 rounded-2xl w-full sm:w-fit">
              {[
                { id: "today", label: "Today" },
                { id: "upcoming", label: "Upcoming (7d)" },
                { id: "all", label: "All History" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    activeTab === tab.id ? "bg-black text-[#FFCC00] shadow-sm" : "text-gray-500 hover:text-black"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Render direct context filter input element only if viewing comprehensive layout logs */}
            {activeTab === "all" && (
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Agent / Status..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:border-black outline-none transition-all shadow-xs"
                />
              </div>
            )}
          </div>

          {/* RENDERING FEED GRID */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400 font-black uppercase tracking-widest">
                Loading schedule data...
              </div>
            ) : (
              <>
                <ShiftFeed shifts={shifts} />

                {/* HISTORICAL PAGINATION INTERACTION LAYER */}
                {activeTab === "all" && (pagination.hasNext || pagination.hasPrev) && (
                  <div className="flex justify-between items-center pt-4">
                    <button
                      onClick={() => loadShifts(page - 1, searchQuery)}
                      disabled={!pagination.hasPrev}
                      className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        pagination.hasPrev ? "bg-white text-black border-gray-200 hover:bg-gray-50" : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                      }`}
                    >
                      Prev
                    </button>

                    <span className="text-[10px] font-black tracking-widest bg-black text-[#FFCC00] px-4 py-2 rounded-xl">
                      {page}
                    </span>

                    <button
                      onClick={() => loadShifts(page + 1, searchQuery)}
                      disabled={!pagination.hasNext}
                      className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        pagination.hasNext ? "bg-white text-black border-gray-200 hover:bg-gray-50" : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
