import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import {getShift,startShift,endShift} from "../services/shifts"; //
import { listReports } from "../services/reports";
import {
  FaArrowLeft, FaCalendarAlt, FaUserShield, FaClock,
  FaPlay, FaStop, FaClipboardCheck, FaExclamationCircle
} from "react-icons/fa";

const ShiftDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shift, setShift] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Fetch shift using your service function
      const shiftRes = await getShift(id);
      setShift(shiftRes.data);

      // 2. Fetch reports
      const reportsRes = await listReports();
      const allReports = reportsRes.data.results || reportsRes.data;

      // 3. Filter reports for this specific shift
      const attachedReports = allReports.filter((report) => {
        return (
          report.shift_active_agent?.id === shiftRes.data.shift_agent?.id &&
          report.created_at?.startsWith(shiftRes.data.shift_date)
        );
      });
      setReports(attachedReports);
    } catch (err) {
      console.error("Error loading shift detail", err);
    } finally {
      setLoading(false);
    }
  };

  // Handler for Start Shift (PATCH)
  const handleStartShift = async () => {
    try {
      setActionLoading(true);
      await startShift(id);
      await loadData(); // Refresh data
    } catch (err) {
      alert("Failed to start shift");
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for End Shift (PATCH)
  const handleEndShift = async () => {
    try {
      setActionLoading(true);
      await endShift(id);
      await loadData(); // Refresh data
    } catch (err) {
      alert("Failed to end shift");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader fullPage message="SCANNING MISSION DATA..." />;
  if (!shift) return <div className="p-10 text-center font-black uppercase tracking-widest">Shift Not Found</div>;

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">

          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black mb-10"
          >
            <FaArrowLeft className="text-[#FFCC00]" /> Return to Roster
          </button>

          {/* Main Shift Header */}
          <div className="bg-black rounded-[3rem] p-10 mb-12 text-white shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
              <div>
                <span className="px-3 py-1 bg-[#FFCC00] text-black rounded-lg text-[9px] font-black uppercase italic tracking-widest">
                  Log ID: #{shift.id}
                </span>
                <h1 className="text-5xl font-black italic uppercase tracking-tighter mt-4">
                  Shift <span className="text-[#FFCC00]">Analysis</span>
                </h1>
              </div>

              {/* Action Buttons (Using your Patch functions) */}
              <div className="flex gap-4">
                {shift.shift_status === "Pending" && (
                  <button
                    onClick={handleStartShift}
                    disabled={actionLoading}
                    className="bg-[#FFCC00] text-black px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-white transition-all"
                  >
                    <FaPlay /> Start Shift
                  </button>
                )}
                {shift.shift_status === "Active" && (
                  <button
                    onClick={handleEndShift}
                    disabled={actionLoading}
                    className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-rose-700 transition-all"
                  >
                    <FaStop /> End Shift
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 border-t border-white/10 pt-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#FFCC00]"><FaCalendarAlt /></div>
                <div>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Date</p>
                  <p className="text-sm font-bold">{shift.shift_date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#FFCC00]"><FaUserShield /></div>
                <div>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Agent</p>
                  <p className="text-sm font-bold uppercase">{shift.shift_agent?.user?.username}</p>
                </div>
              </div>
              <div className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 h-fit self-center ${
                shift.shift_status === 'Active' ? 'bg-[#FF8800] text-white' : 'bg-white/10 text-gray-400'
              }`}>
                {shift.shift_status}
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-6">
            <h2 className="text-[12px] font-black text-black uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
              <span className="w-10 h-[2px] bg-black"></span>
              Activity Reports
            </h2>

            {reports.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-gray-100">
                <FaExclamationCircle className="mx-auto text-3xl text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No activity logs recorded.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`w-2 h-2 rounded-full ${report.is_approved ? 'bg-green-500' : 'bg-[#FFCC00]'}`}></span>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-black">{report.activity_type}</h4>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{report.description}</p>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <span className="text-[9px] font-black uppercase italic text-gray-400">{report.activity_status}</span>
                      <div className="mt-2 text-[10px] font-black text-black">
                        {report.is_approved ? "✓ APPROVED" : "○ PENDING"}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftDetail;