import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { retrieveProfile } from '../services/profile';
import Sidebar from "../components/Sidebar";
import {
  FaUser, FaEnvelope, FaBuilding, FaIdBadge,
  FaInfoCircle, FaArrowLeft, FaCheckCircle, FaShieldAlt
} from 'react-icons/fa';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await retrieveProfile(id);
        setProfile(response.data);
      } catch (err) {
        setError(err.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFCC00]"></div>
        <p className="text-[#FFCC00] text-[10px] font-black uppercase tracking-[0.3em]">Syncing Profile...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB] p-10 text-center">
      <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-gray-100 max-w-md">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
           <FaInfoCircle size={30} />
        </div>
        <p className="text-black font-black uppercase tracking-widest mb-6">Data Retrieval Error</p>
        <p className="text-gray-500 text-sm mb-8">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="w-full py-4 bg-black text-[#FFCC00] rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen">
      <Sidebar />

      <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
        {/* Top Navigation */}
        <div className="max-w-5xl mx-auto flex justify-between items-center mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-all group"
          >
            <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-black group-hover:text-[#FFCC00] transition-all">
               <FaArrowLeft />
            </div>
            Back to Directory
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Personnel</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Main Profile Card */}
          <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">

            {/* Branded Header / Cover */}
            <div className="h-48 bg-black relative">
               {/* Pattern overlay */}
               <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#FFCC00 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>

               <div className="absolute -bottom-16 left-12">
                  <div className="w-32 h-32 bg-[#FFCC00] rounded-[2rem] flex items-center justify-center text-black text-5xl font-black shadow-2xl border-[10px] border-white ring-1 ring-black/5">
                    {profile?.username?.charAt(0).toUpperCase()}
                  </div>
               </div>
            </div>

            <div className="pt-20 pb-12 px-12">
              {/* Name & Identity Section */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-50 pb-10">
                <div>
                  <div className="flex items-center gap-4">
                    <h1 className="text-5xl font-black italic uppercase tracking-tighter text-black">
                      {profile?.username}
                    </h1>
                    <FaCheckCircle className="text-blue-500 text-2xl" title="System Verified" />
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="px-3 py-1 bg-black text-[#FFCC00] text-[9px] font-black uppercase tracking-[0.2em] rounded-md">
                      {profile?.user_type?.replace('_', ' ') || "Personnel"}
                    </span>
                    <span className="text-gray-300">/</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Node ID: {id}</span>
                  </div>
                </div>

                <button className="px-8 py-4 bg-white border-2 border-black text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-black hover:text-[#FFCC00] transition-all shadow-lg">
                  Edit Credentials
                </button>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">

                {/* Information Tile Component */}
                {[
                  { label: "Official Email", value: profile?.email, icon: <FaEnvelope />, color: "text-blue-500" },
                  { label: "Department", value: profile?.department?.title || "Unassigned", icon: <FaBuilding />, color: "text-purple-500" },
                  { label: "Permission Tier", value: profile?.user_type, icon: <FaShieldAlt />, color: "text-emerald-500" },
                  { label: "Employment Status", value: "Active / Full-Time", icon: <FaIdBadge />, color: "text-[#FFCC00]" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-6 p-7 rounded-[2rem] bg-gray-50/50 border border-transparent hover:border-gray-100 hover:bg-white hover:shadow-xl transition-all group">
                    <div className="p-4 bg-white rounded-2xl shadow-sm text-black group-hover:bg-black group-hover:text-[#FFCC00] transition-all">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                      <p className="font-bold text-black uppercase tracking-tight break-all">{item.value || "---"}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Personnel Biography Area */}
              <div className="mt-12 group">
                <div className="bg-black rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl transition-transform hover:scale-[1.01]">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-1 bg-[#FFCC00]"></div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFCC00]">Operations Bio</h3>
                    </div>
                    <p className="text-lg text-gray-300 leading-relaxed font-medium italic opacity-90">
                      "{profile?.bio || "Operational profile pending description. No biography recorded in the central directory for this employee."}"
                    </p>
                  </div>

                  {/* Background Decorative Element */}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#FFCC00] opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity"></div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Branding */}
          <div className="mt-10 text-center">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">
              Onafriq Personnel Registry System &copy; 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}