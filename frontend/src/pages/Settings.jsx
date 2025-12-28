import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { retrieveProfile, updateProfile } from "../services/profile";
import axios from "axios";
import {
  FaUser, FaEnvelope, FaLock, FaBell, FaPalette, FaShieldAlt,
  FaSave, FaTimes, FaCheck, FaCog, FaExclamationTriangle, FaGlobe
} from "react-icons/fa";

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [profileData, setProfileData] = useState({ username: "", email: "", first_name: "", last_name: "" });
  const [passwordData, setPasswordData] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [notificationSettings, setNotificationSettings] = useState({ email_notifications: true, push_notifications: true, shift_reminders: true, report_updates: false });
  const [appearanceSettings, setAppearanceSettings] = useState({ theme: "light", language: "en", timezone: "UTC" });

  useEffect(() => { fetchUserData(); }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const data = await retrieveProfile();
      setProfileData({
        username: data.username || "",
        email: data.email || "",
        first_name: data.first_name || "",
        last_name: data.last_name || "",
      });
    } catch (err) {
      setError("FAILED TO RETRIEVE SECURITY PROFILE.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profileData);
      setSuccess("PROFILE SYNCHRONIZED.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError("SYNC FAILED."); }
    finally { setSaving(false); }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError("KEY MISMATCH: PASSWORDS DO NOT MATCH.");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('access');
      await axios.post('http://127.0.0.1:8000/api/password/change/',
        { current_password: passwordData.current_password, new_password: passwordData.new_password },
        { headers: { 'Authorization': `Token ${token}` } }
      );
      setSuccess("SECURITY KEY UPDATED.");
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) { setError("AUTHORIZATION DENIED."); }
    finally { setSaving(false); }
  };

  const tabs = [
    { id: "profile", name: "User Identity", icon: <FaUser /> },
    { id: "password", name: "Security Key", icon: <FaLock /> },
    { id: "notifications", name: "Alert Nodes", icon: <FaBell /> },
    { id: "appearance", name: "Interface", icon: <FaPalette /> },
  ];

  if (loading) return <Loader fullPage message="INITIALIZING SETTINGS CONSOLE..." />;

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen font-sans">
      <Sidebar />
      <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">

          {/* Branded Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-1 bg-[#FFCC00]"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">System Preferences</span>
            </div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-black">
              Account <span className="text-[#FF8800]">Control</span>
            </h1>
          </div>

          {/* Feedback Alerts */}
          {success && (
            <div className="mb-8 bg-black text-[#FFCC00] px-6 py-4 rounded-2xl flex items-center gap-4 animate-slide-in shadow-2xl">
              <FaCheck className="text-sm" />
              <span className="text-[11px] font-black uppercase tracking-widest">{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Sidebar Command Menu */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-[2rem] p-3 shadow-sm border border-gray-100 sticky top-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all mb-1 ${
                      activeTab === tab.id
                        ? "bg-black text-[#FFCC00] shadow-xl shadow-black/10 scale-105"
                        : "text-gray-400 hover:text-black hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm">{tab.icon}</span>
                    <span className="text-[11px] font-black uppercase tracking-widest">{tab.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Configuration Deck */}
            <div className="lg:col-span-9">
              <div className="bg-white rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-gray-100 p-10 lg:p-14">

                {/* Profile Identity Section */}
                {activeTab === "profile" && (
                  <form onSubmit={handleProfileUpdate} className="space-y-8 animate-in fade-in duration-500">
                    <h2 className="text-[12px] font-black text-black uppercase tracking-[0.4em] border-b border-gray-100 pb-6 mb-8">Personnel Identity</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System Username</label>
                        <input type="text" value={profileData.username} disabled className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-400 cursor-not-allowed text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Email</label>
                        <input type="email" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FFCC00] transition-all outline-none font-bold text-sm" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-6">
                      <button type="submit" disabled={saving} className="bg-black text-[#FFCC00] px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#FF8800] hover:text-black transition-all shadow-xl">
                        {saving ? "SYNCING..." : "COMMIT CHANGES"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Password / Key Section */}
                {activeTab === "password" && (
                  <form onSubmit={handlePasswordUpdate} className="space-y-8 animate-in fade-in duration-500">
                    <h2 className="text-[12px] font-black text-black uppercase tracking-[0.4em] border-b border-gray-100 pb-6 mb-8">Access Key Rotation</h2>
                    <div className="space-y-6 max-w-md">
                      {['current_password', 'new_password', 'confirm_password'].map((key) => (
                        <div key={key} className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{key.replace('_', ' ')}</label>
                          <div className="relative">
                            <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input
                              type="password"
                              value={passwordData[key]}
                              onChange={(e) => setPasswordData({ ...passwordData, [key]: e.target.value })}
                              className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FF8800] transition-all outline-none font-bold"
                              required
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-6">
                      <button type="submit" disabled={saving} className="bg-black text-[#FFCC00] px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#FF8800] hover:text-black transition-all shadow-xl">
                        ROTATE ACCESS KEY
                      </button>
                    </div>
                  </form>
                )}

                {/* Notifications Section */}
                {activeTab === "notifications" && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <h2 className="text-[12px] font-black text-black uppercase tracking-[0.4em] border-b border-gray-100 pb-6 mb-8">Alert Node Configuration</h2>
                    <div className="grid gap-4">
                      {Object.keys(notificationSettings).map((key) => (
                        <div key={key} className="flex items-center justify-between p-6 bg-gray-50 rounded-[1.5rem] border border-transparent hover:border-[#FFCC00] transition-all group">
                          <div>
                            <h3 className="text-xs font-black uppercase text-black mb-1 italic">{key.replace('_', ' ')}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active System Trigger</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={notificationSettings[key]} className="sr-only peer" onChange={(e) => setNotificationSettings({...notificationSettings, [key]: e.target.checked})} />
                            <div className="w-12 h-6 bg-gray-200 peer-focus:ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Appearance Section */}
                {activeTab === "appearance" && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <h2 className="text-[12px] font-black text-black uppercase tracking-[0.4em] border-b border-gray-100 pb-6 mb-8">Interface Parameters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {['theme', 'language', 'timezone'].map((setting) => (
                        <div key={setting} className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{setting}</label>
                          <select className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FFCC00] outline-none font-bold text-xs uppercase tracking-widest appearance-none">
                            <option>{appearanceSettings[setting]}</option>
                            <option>Advanced Node (Coming Soon)</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}