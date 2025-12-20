import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { retrieveEmployee, updateEmployee } from "../services/employee";
import Loader from "../components/Loader";
import {
  FaUser,
  FaEnvelope,
  FaBuilding,
  FaEdit,
  FaSave,
  FaTimes,
  FaArrowLeft,
  FaPhone,
  FaCalendar,
  FaBriefcase,
  FaIdCard
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
      console.error(err.response || err);
      setError("Failed to load employee details");
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
      setSuccess("Employee updated successfully!");
      setEditMode(false);
      await fetchEmployee(); // Refresh data

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err.response || err);
      setError("Failed to update employee. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(employee); // Reset form data
    setEditMode(false);
    setError("");
    setSuccess("");
  };

  if (loading) {
    return <Loader fullPage message="Loading employee details..." />;
  }

  if (error && !employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTimes className="text-red-600 text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Employee</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/employees")}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/employees")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
          >
            <FaArrowLeft />
            <span className="font-medium">Back to Employees</span>
          </button>

          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md"
            >
              <FaEdit />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start animate-pulse">
            <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-12">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl">
                <span className="text-4xl font-bold text-indigo-600">
                  {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                </span>
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2">{employee.full_name || "Employee Name"}</h1>
                <p className="text-indigo-100 flex items-center space-x-2">
                  <FaBriefcase />
                  <span>{employee.position || "Position Not Set"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            {editMode ? (
              // Edit Mode
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Employee Information</h2>

                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaUser className="inline mr-2 text-gray-400" />
                      First Name
                    </label>
                    <input
                      name="first_name"
                      value={formData.first_name || ""}
                      onChange={handleChange}
                      placeholder="First Name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaUser className="inline mr-2 text-gray-400" />
                      Last Name
                    </label>
                    <input
                      name="last_name"
                      value={formData.last_name || ""}
                      onChange={handleChange}
                      placeholder="Last Name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaEnvelope className="inline mr-2 text-gray-400" />
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaPhone className="inline mr-2 text-gray-400" />
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone || ""}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaBriefcase className="inline mr-2 text-gray-400" />
                      Position
                    </label>
                    <input
                      name="position"
                      value={formData.position || ""}
                      onChange={handleChange}
                      placeholder="Job Position"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* Department (if editable) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaBuilding className="inline mr-2 text-gray-400" />
                      Department
                    </label>
                    <input
                      name="department_name"
                      value={formData.department_name || ""}
                      onChange={handleChange}
                      placeholder="Department"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FaSave />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition"
                  >
                    <FaTimes />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Employee Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 text-gray-600 mb-2">
                      <FaEnvelope className="text-indigo-600" />
                      <span className="text-sm font-medium">Email Address</span>
                    </div>
                    <p className="text-gray-800 font-semibold">{employee.email || "Not provided"}</p>
                  </div>

                  {/* Phone */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 text-gray-600 mb-2">
                      <FaPhone className="text-indigo-600" />
                      <span className="text-sm font-medium">Phone Number</span>
                    </div>
                    <p className="text-gray-800 font-semibold">{employee.phone || "Not provided"}</p>
                  </div>

                  {/* Department */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 text-gray-600 mb-2">
                      <FaBuilding className="text-indigo-600" />
                      <span className="text-sm font-medium">Department</span>
                    </div>
                    <p className="text-gray-800 font-semibold">{employee.department_name || "Not assigned"}</p>
                  </div>

                  {/* Position */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 text-gray-600 mb-2">
                      <FaBriefcase className="text-indigo-600" />
                      <span className="text-sm font-medium">Position</span>
                    </div>
                    <p className="text-gray-800 font-semibold">{employee.position || "Not set"}</p>
                  </div>

                  {/* Employee ID */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 text-gray-600 mb-2">
                      <FaIdCard className="text-indigo-600" />
                      <span className="text-sm font-medium">Employee ID</span>
                    </div>
                    <p className="text-gray-800 font-semibold">#{employee.id}</p>
                  </div>

                  {/* Join Date */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 text-gray-600 mb-2">
                      <FaCalendar className="text-indigo-600" />
                      <span className="text-sm font-medium">Date Joined</span>
                    </div>
                    <p className="text-gray-800 font-semibold">
                      {employee.date_joined
                        ? new Date(employee.date_joined).toLocaleDateString()
                        : "Not available"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}