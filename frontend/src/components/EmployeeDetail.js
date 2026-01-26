import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { retrieveEmployee, updateEmployee } from "../services/employee";
import Loader from "../components/Loader";
import {
  FaUser, FaEnvelope, FaEdit, FaSave, FaTimes,
  FaArrowLeft, FaCalendar, FaBriefcase, FaIdCard, FaShieldAlt
} from "react-icons/fa";

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [formData, setFormData] = useState({});
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchEmployee();
    // eslint-disable-next-line
  }, [id]);

  const fetchEmployee = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await retrieveEmployee(id);
      setEmployee(res.data);
      setFormData(res.data);

      const loggedEmployeeId = localStorage.getItem("employee_id");
      setIsOwnProfile(String(res.data.id) === String(loggedEmployeeId));

    } catch (err) {
      if (err.response?.status === 404) {
        setError("ACCESS DENIED: You can only view your own profile.");
      } else if (err.response?.status === 403) {
        setError("PERMISSION DENIED.");
      } else {
        setError("SYSTEM ERROR: Unable to load personnel record.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (!isOwnProfile) {
      setError("ACCESS VIOLATION: You cannot modify another employee.");
      return;
    }

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

  if (loading) {
    return <Loader fullPage message="FETCHING PERSONNEL RECORD..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md">
          <FaShieldAlt className="text-red-500 text-4xl mx-auto mb-4" />
          <h2 className="text-lg font-black uppercase mb-2">Access Error</h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/employees")}
            className="bg-black text-[#FFCC00] px-6 py-3 rounded-xl font-black uppercase text-xs"
          >
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      {/* Top Bar */}
      <div className="bg-white border-b py-4 px-8 flex justify-between items-center sticky top-0 z-30">
        <button
          onClick={() => navigate("/employees")}
          className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black"
        >
          <FaArrowLeft className="text-[#FFCC00]" /> Back to Directory
        </button>

        {!editMode && isOwnProfile && (
          <button
            onClick={() => setEditMode(true)}
            className="bg-black text-[#FFCC00] px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
          >
            <FaEdit /> Edit Profile
          </button>
        )}
      </div>

      <div className="max-w-5xl mx-auto mt-12 px-4">
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl flex items-center gap-3">
            <FaShieldAlt /> {success}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow border overflow-hidden">
          {/* Header */}
          <div className="bg-black p-12 text-white">
            <h1 className="text-4xl font-black uppercase">
              {employee.username || "Employee"}
            </h1>
            <p className="text-sm text-gray-400 uppercase tracking-widest mt-2">
              {employee.user_type || "Role Unassigned"}
            </p>
          </div>

          {/* Content */}
          <div className="p-10">
            {editMode ? (
              <>
                <h2 className="text-xs font-black uppercase tracking-widest mb-6">
                  Edit Profile
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {["first_name", "last_name", "email", "phone"].map((field) => (
                    <input
                      key={field}
                      name={field}
                      value={formData[field] || ""}
                      onChange={handleChange}
                      placeholder={field.replace("_", " ").toUpperCase()}
                      className="w-full p-4 rounded-xl bg-gray-50 border focus:ring-2 focus:ring-[#FFCC00]"
                    />
                  ))}
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-black text-[#FFCC00] py-4 rounded-xl font-black uppercase"
                  >
                    <FaSave /> Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-100 py-4 rounded-xl font-black uppercase"
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xs font-black uppercase tracking-widest mb-6">
                  Personnel Record
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                  <Info label="Employee ID" value={id} icon={<FaIdCard />} />
                  <Info label="Email" value={employee.email || ""} icon={<FaEnvelope />} />
                  <Info label="Bio" value={employee.bio || ""} icon={<FaIdCard />} />
                  <Info label="Date Hired" value={employee.hire_date?.slice(0, 10)} icon={<FaCalendar />} />
                  <Info label="Position" value={employee.user_type || "Staff"} icon={<FaBriefcase />} />
                  <Info label="Department" value={employee.department.title || "N/A"} icon={<FaUser />} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, icon }) {
  return (
    <div className="bg-gray-50 p-6 rounded-xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-[#FFCC00]">{icon}</div>
        <span className="text-xs font-black uppercase tracking-widest text-gray-400">
          {label}
        </span>
      </div>
      <p className="font-normal text-gray-700">{value}</p>
    </div>
  );
}
