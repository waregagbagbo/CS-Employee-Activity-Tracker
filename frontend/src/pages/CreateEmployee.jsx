import React, { useState } from "react";
import { createUser } from "./Register"; // API to create a new CustomUser
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

export default function EmployeeCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    hire_date: "",
    bio: "",
    department: "",
    user_type: "employee_agent",
    supervisor: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Step 1: Create the user (auto-creates Employee profile)
      const userPayload = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        password: formData.password,
      };

      const res = await createUser(userPayload);
      const userId = res.data.id;

      // Step 2: Redirect to Employee Edit page to update profile
      setSuccess("User created successfully! Redirecting to Employee profile...");
      setTimeout(() => {
        navigate(`/employees/${userId}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.email ||
        "Failed to create user. Check input fields."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <div className="bg-white rounded-[2rem] shadow-xl p-10 w-full max-w-xl">
        <h2 className="text-2xl font-black uppercase tracking-widest mb-6">
          Add New Employee
        </h2>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {success && <p className="text-emerald-600 text-sm mb-4">{success}</p>}

        <div className="space-y-4">
          {[
            { label: "Email", name: "email", type: "email" },
            { label: "First Name", name: "first_name" },
            { label: "Last Name", name: "last_name" },
            { label: "Username", name: "username" },
            { label: "Password", name: "password", type: "password" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-xs font-bold mb-1">{field.label}</label>
              <input
                type={field.type || "text"}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#FFCC00]"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full bg-black text-[#FFCC00] py-3 font-black uppercase tracking-widest rounded-xl hover:bg-[#FF8800] hover:text-black transition-all"
        >
          {loading ? <Loader /> : "Create Employee"}
        </button>
      </div>
    </div>
  );
}
