import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { retrieveEmployee, updateEmployee } from "../services/employee";
import Loader from "../components/Loader";
import {
  FaUser, FaEnvelope, FaBuilding, FaEdit, FaSave, FaTimes,
  FaArrowLeft, FaPhone, FaCalendar, FaBriefcase, FaIdCard, FaShieldAlt
} from "react-icons/fa";

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await retrieveEmployee(id);
      setEmployee(res.data);
      setFormData(res.data);
    } catch (err) {
      setError("CRITICAL: UNABLE TO RETRIEVE PERSONNEL RECORD.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateEmployee(id, formData);
      setSuccess("RECORD SYNCHRONIZED SUCCESSFULLY.");
      setEditMode(false);
      await fetchEmployee();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("SYNC FAILED: VALIDATE INPUT PARAMETERS.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(employee);
    setEditMode(false);
    setError("");
  };

  if (loading) return <Loader fullPage message="FETCHING PERSONNEL RECORD..." />;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-100 py-4 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <button
          onClick={() => navigate("/employees")}
          className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-all"
        >
          <FaArrowLeft className="text-[#FFCC00]" /> Back to Directory
        </button>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="bg-black text-[#FFCC00] px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-105 transition-all flex items-center gap-2"
          >
            <FaEdit /> Edit Profile
          </button>
        )}
      </div>

      <div className="max-w-5xl mx-auto mt-12 px-4">
        {/* Alerts */}
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-pulse">
            <FaShieldAlt className="text-emerald-500" />
            <span className="text-[11px] font-black uppercase tracking-widest">{success}</span>
          </div>
        )}

        {/* Main Profile Card */}
        <div className="bg-white rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">

          {/* Header Block */}
          <div className="bg-black p-10 lg:p-16 relative overflow-hidden">
             {/* Abstract Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFCC00] opacity-5 rounded-bl-full translate-x-10 -translate-y-10"></div>

            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 text-center md:text-left">
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-[#FF8800] to-[#FFCC00] flex items-center justify-center shadow-2xl rotate-3">
                <span className="text-4xl font-black text-black italic">
                  {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-lg mb-3 mx-auto md:mx-0">
                  <FaShieldAlt className="text-[#FFCC00] text-[10px]" />
                  <span className="text-[9px] font-black text-[#FFCC00] uppercase tracking-widest">Employee Node Verified</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter text-white mb-2">
                  {employee.full_name || "New Personnel"}
                </h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center md:justify-start gap-2 italic">
                  <FaBriefcase className="text-[#FFCC00]" /> {employee.position || "POSITION UNASSIGNED"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-10 lg:p-16">
            {editMode ? (
              /* --- EDIT MODE --- */
              <div className="space-y-8 animate-in fade-in duration-500">
                <h2 className="text-[11px] font-black text-black uppercase tracking-[0.4em] mb-10 border-b border-gray-100 pb-4">
                  Registry Update Mode
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { label: "First Name", name: "first_name", icon: <FaUser /> },
                    { label: "Last Name", name: "last_name", icon: <FaUser /> },
                    { label: "Corporate Email", name: "email", icon: <FaEnvelope />, type: "email" },
                    { label: "Contact Phone", name: "phone", icon: <FaPhone />, type: "tel" },
                    { label: "Assigned Position", name: "position", icon: <FaBriefcase /> },
                    { label: "Department Node", name: "department_name", icon: <FaBuilding /> },
                  ].map((field) => (
                    <div key={field.name} className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        {field.label}
                      </label>
                      <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FFCC00] transition-colors">
                          {field.icon}
                        </span>
                        <input
                          name={field.name}
                          type={field.type || "text"}
                          value={formData[field.name] || ""}
                          onChange={handleChange}
                          className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FFCC00] transition-all outline-none font-bold text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-10">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-black text-[#FFCC00] py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-[#FF8800] hover:text-black transition-all flex items-center justify-center gap-3"
                  >
                    {saving ? <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" /> : <><FaSave /> Save Changes</>}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center gap-3"
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* --- VIEW MODE --- */
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-[11px] font-black text-black uppercase tracking-[0.4em] mb-10 border-b border-gray-100 pb-4">
                  Personnel Record Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { label: "System Identification", value: `#${employee.id}`, icon: <FaIdCard /> },
                    { label: "Node Joined", value: employee.date_joined ? new Date(employee.date_joined).toLocaleDateString() : "N/A", icon: <FaCalendar /> },
                    { label: "Operational Dept", value: employee.department_name || "Unassigned", icon: <FaBuilding /> },
                    { label: "Direct Email", value: employee.email || "No Data", icon: <FaEnvelope /> },
                    { label: "Phone Line", value: employee.phone || "No Data", icon: <FaPhone /> },
                    { label: "Job Node", value: employee.position || "Staff", icon: <FaBriefcase /> },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-50 hover:bg-white hover:shadow-xl hover:border-white transition-all group">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-[#FFCC00] group-hover:bg-black transition-colors">
                          {item.icon}
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                      </div>
                      <p className="text-sm font-black text-black uppercase tracking-tight ml-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Ledger Note */}
          <div className="bg-gray-50/30 px-10 py-6 border-t border-gray-50 flex justify-between items-center">
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em]">Onafriq Infrastructure Personnel Record</span>
            <div className="flex gap-1">
              <div className="w-4 h-1 bg-[#FFCC00]"></div>
              <div className="w-1 h-1 bg-black"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}