import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar, Clock, Users, Plus, X, ClipboardList, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { ReportService } from '../services/reports';
import ReportForm from '../components/ReportForm';
import ReportFeed from '../components/ReportFeed';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ hasNext: false, hasPrev: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isFetchingRef = useRef(false); // Guard against overlapping in-flight requests

  // 1. READ RAW APP VARIABLES FROM YOUR LOCALSTORAGE EXACT KEYS:
  const userType = localStorage.getItem("user_role") || "Employee";
  const username = localStorage.getItem("username") || "Agent";

  // Determine supervisor authorization matches layout requirements
  const isSupervisor = ['Supervisor', 'Manager', 'Admin'].includes(userType);

  // 2. FETCH PAGINATED DRF REPORTS VIA DECOUPLED POLL LOOPS:
  const loadReports = useCallback(async (targetPage = 1) => {
    if (isFetchingRef.current) return; // skip if already fetching
    isFetchingRef.current = true;
    setError(null);

    try {
      const data = await ReportService.getReports(targetPage);
      setReports(data.results || []);
      setPagination({ hasNext: data.hasNext, hasPrev: data.hasPrev });
      setPage(targetPage);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 429) {
        setError('Too many requests — slowing down sync...');
      } else {
        setError('Terminal Link Failure');
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Poll configuration: auto synchronization loops every 60 seconds
  useEffect(() => {
    loadReports(1);
    const reportInterval = setInterval(() => loadReports(page), 60000);
    return () => clearInterval(reportInterval);
  }, [loadReports, page]);

  // 3. DISPATCH SUPERVISOR APPROVAL ACTIONS ON TARGET BLOCKS:
  const handleApprovalAction = async (id) => {
    if (!window.confirm('Certify and release this activity report log?')) return;
    try {
      await ReportService.approveReport(id);
      // Synchronize component arrays state data natively
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_approved: true } : r))
      );
    } catch (err) {
      alert(`Approval error execution failed: ${err.response?.data?.error || err.message}`);
    }
  };

  // Callback wrapper passed to the create handler modal close logic
  const handleFormSuccess = () => {
    setShowCreateModal(false);
    loadReports(1);
  };

  if (loading) return (
    <div className="flex bg-[#F9FAFB] h-screen">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center font-black uppercase tracking-widest animate-pulse text-gray-400">
        Syncing Performance Records...
      </div>
    </div>
  );

  return (
    <div className="flex bg-[#F9FAFB] h-screen w-full font-sans text-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Topbar title="Operations Reports" user={username} />

        <main className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 pb-32">

          {/* HEADER HEADER BLOCK */}
          <section className="bg-black p-8 rounded-[2.5rem] shadow-2xl text-white flex flex-col lg:flex-row justify-between items-center gap-6 border-b-4 border-[#FFCC00]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800 text-[#FFCC00]">
                <ClipboardList size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black italic tracking-tighter uppercase text-[#FFCC00]">Activity Logging Hub</h1>
                <p className="text-gray-400 font-mono text-[10px] uppercase tracking-[0.2em] mt-1">System Performance & Compliance Registry</p>
              </div>
            </div>
            {!isSupervisor && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#FFCC00] text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-white transition-all shadow-xl"
              >
                <Plus size={16} /> File Shift Log
              </button>
            )}
          </section>

          {/* ERROR STATUS PORTAL BANNER */}
          {error && (
            <div className="bg-rose-50 text-rose-500 font-black uppercase text-xs tracking-widest p-4 rounded-2xl text-center flex items-center justify-center gap-2 border border-rose-100">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* MAIN MODULE CONTENT SPLIT STREAM */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200/60 pb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <FileText size={16} className="text-[#FFCC00]" />
                {isSupervisor ? "Review Team Performance Queues" : "Your Evaluation Logging History"}
              </h3>
              <span className="text-[10px] font-mono bg-gray-200 text-gray-700 px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                Role: {userType}
              </span>
            </div>

            {/* Premium Custom Feed Parser UI grid layout */}
            <ReportFeed reports={reports} isSupervisor={isSupervisor} onApproveReport={handleApprovalAction} />

            {/* STYLED FOOTER NAVIGATION CONTROLS BLOCK */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
              <button
                onClick={() => loadReports(page - 1)}
                disabled={!pagination.hasPrev}
                className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                  pagination.hasPrev ? "bg-white text-black border-gray-200 hover:bg-gray-50 cursor-pointer shadow-sm" : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                }`}
              >
                ◀ Previous
              </button>

              <span className="text-[10px] font-black uppercase tracking-widest bg-black text-[#FFCC00] px-5 py-2.5 rounded-xl shadow-md">
                Page {page}
              </span>

              <button
                onClick={() => loadReports(page + 1)}
                disabled={!pagination.hasNext}
                className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                  pagination.hasNext ? "bg-white text-black border-gray-200 hover:bg-gray-50 cursor-pointer shadow-sm" : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                }`}
              >
                Next ▶
              </button>
            </div>
          </div>

        </main>

        {/* MODAL WRAPPER SLUDGE SLOT PORTAL */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border-t-8 border-[#FFCC00] max-h-[90vh] flex flex-col">

              {/* Modal Head */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="font-black text-lg uppercase tracking-tight text-black">New Operational Log Entry</h3>
                  <p className="text-gray-400 font-mono text-[9px] uppercase tracking-wider mt-0.5">Publish deployment metrics to supervisor registry</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-200 rounded-xl text-gray-500 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Inner Scroll Slot Body */}
              <div className="p-6 overflow-y-auto flex-1">
                <ReportForm onReportSubmitted={handleFormSuccess} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
