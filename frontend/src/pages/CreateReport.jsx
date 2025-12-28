import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Loader from "../components/Loader";
import { createReport } from "../services/reports";
import { FaFileAlt, FaSave, FaArrowLeft } from "react-icons/fa";

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
      navigate("/reports"); // back to reports list
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Failed to create activity report"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>

        <div className="max-w-2xl bg-white rounded-xl shadow-md p-8">
          <h1 className="text-2xl font-bold mb-6 flex items-center">
            <FaFileAlt className="mr-2 text-indigo-600" />
            Create Activity Report
          </h1>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Activity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Type
              </label>
              <input
                type="text"
                name="activity_type"
                required
                value={formData.activity_type}
                onChange={handleChange}
                placeholder="e.g. Patrol, Inspection, Monitoring"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Activity Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Status
              </label>
              <select
                name="activity_status"
                required
                value={formData.activity_status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select status</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows="4"
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the activity performed..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? (
                  <Loader small />
                ) : (
                  <>
                    <FaSave />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
