import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { createReport } from "../services/reports";
import { FaFileAlt, FaSave, FaArrowLeft, FaShieldAlt, FaHistory } from "react-icons/fa";

export default function CreateReport() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    activity_type: "",
    activity_status: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createReport(formData);
      navigate("/reports");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "DISPATCH FAILED: UNABLE TO SYNCHRONIZE REPORT NODE."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-3xl mx-auto">

          {/* Top Navigation */}
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-all mb-10"
          >
            <FaArrowLeft className="text-[#FFCC00] group-hover:-translate-x-1 transition-transform" />
            Return to Ledger
          </button>

          <div className="bg-white rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">

            {/* Form Header Block */}
            <div className="bg-black p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFCC00] opacity-10 rounded-bl-full"></div>
              <div className="relative z-10 flex items-center gap-5">
                <div className="w-14 h-14 bg-[#FFCC00] rounded-2xl flex items-center justify-center text-black shadow-lg rotate-3">
                  <FaFileAlt className="text-xl" />
                </div>
                <div>
                  <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                    New Activity <span className="text-[#FF8800]">Log</span>
                  </h1>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] mt-1">
                    System Node: Dispatch-Alpha
                  </p>
                </div>
              </div>
            </div>

            <div className="p-10 lg:p-14">
              {error && (
                <div className="mb-8 bg-rose-50 border border-rose-100 text-rose-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-shake">
                  <FaShieldAlt className="flex-shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Activity Type */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Operational Category
                  </label>
                  <div className="relative group">
                    <FaHistory className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FFCC00] transition-colors" />
                    <input
                      type="text"
                      name="activity_type"
                      required
                      value={formData.activity_type}
                      onChange={handleChange}
                      placeholder="e.g. INFRASTRUCTURE MONITORING"
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FFCC00] transition-all outline-none font-bold text-sm uppercase tracking-tight placeholder:text-gray-300"
                    />
                  </div>
                </div>

                {/* Activity Status */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Current Node Status
                  </label>
                  <div className="relative">
                    <select
                      name="activity_status"
                      required
                      value={formData.activity_status}
                      onChange={handleChange}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FF8800] transition-all outline-none font-black text-[10px] uppercase tracking-[0.2em] appearance-none"
                    >
                      <option value="">INITIALIZE STATUS...</option>
                      <option value="Completed">● COMPLETED</option>
                      <option value="In Progress">● IN PROGRESS</option>
                      <option value="Pending">● PENDING</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Personnel Observation / Description
                  </label>
                  <textarea
                    name="description"
                    rows="5"
                    required
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter detailed activity briefing..."
                    className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-[2rem] focus:bg-white focus:ring-2 focus:ring-[#FFCC00] transition-all outline-none font-bold text-sm placeholder:text-gray-300"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto bg-black text-[#FFCC00] px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-[#FF8800] hover:text-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
                  >
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-[#FFCC00] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <FaSave className="group-hover:scale-125 transition-transform" />
                        <span>Commit Report to Ledger</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom Utility Bar */}
            <div className="bg-gray-50 px-10 py-5 flex justify-between items-center border-t border-gray-100">
              <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.5em]">
                Onafriq Security Protocol v4.0
              </span>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FFCC00] animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}