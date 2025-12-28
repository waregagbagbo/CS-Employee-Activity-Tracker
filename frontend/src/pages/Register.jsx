import { useState } from "react";
import { registerUser } from "../services/auth";
import { FaUser, FaEnvelope, FaLock, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirmation: "",
  });

  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const updateField = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (form.password !== form.password_confirmation) {
      setStatus({ type: "error", message: "Security sync failed: Passwords do not match." });
      return;
    }

    if (form.password.length < 8) {
      setStatus({ type: "error", message: "Password must be at least 8 characters for compliance." });
      return;
    }

    setLoading(true);

    try {
      await registerUser(form);
      setStatus({ type: "success", message: "Account created! Redirecting to secure login..." });
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (err) {
      setStatus({
        type: "error",
        message: err.response?.data?.message || "Registration failed. Verify your details."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Branded Background Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFCC00] opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF8800] opacity-10 rounded-full blur-3xl -ml-20 -mb-20"></div>

      <div className="max-w-xl w-full relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">

          {/* Header Section */}
          <div className="bg-black p-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-[#FF8800] to-[#FFCC00] rounded-3xl mb-6 shadow-xl transform -rotate-3">
              <FaUser className="text-black text-3xl" />
            </div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">
              Join <span className="text-[#FFCC00]">Onafriq</span>
            </h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Personnel Onboarding Portal</p>
          </div>

          <div className="p-10">
            {/* Status Messages */}
            {status.message && (
              <div
                className={`mb-8 px-6 py-4 rounded-2xl flex items-center gap-4 animate-bounce-short ${
                  status.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-rose-50 text-rose-700 border border-rose-100"
                }`}
              >
                {status.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
                <span className="text-[11px] font-black uppercase tracking-widest leading-tight">{status.message}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System Handle</label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      name="username"
                      type="text"
                      placeholder="username"
                      value={form.username}
                      onChange={updateField}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FFCC00] transition-all outline-none font-bold text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Work Email</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      name="email"
                      type="email"
                      placeholder="name@onafriq.com"
                      value={form.email}
                      onChange={updateField}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FFCC00] transition-all outline-none font-bold text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                  <input
                    name="first_name"
                    type="text"
                    value={form.first_name}
                    onChange={updateField}
                    required
                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FFCC00] transition-all outline-none font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input
                    name="last_name"
                    type="text"
                    value={form.last_name}
                    onChange={updateField}
                    required
                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FFCC00] transition-all outline-none font-bold text-sm"
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-orange-600">Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={updateField}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FF8800] transition-all outline-none font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-orange-600">Verify</label>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      name="password_confirmation"
                      type="password"
                      value={form.password_confirmation}
                      onChange={updateField}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FF8800] transition-all outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-[#FFCC00] py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-[#FFCC00] hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-4 group"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="group-hover:scale-110 transition-transform">Complete Registration</span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Already have credentials?{" "}
                <a href="/" className="text-black underline decoration-[#FFCC00] decoration-2 underline-offset-4 hover:text-[#FF8800] transition-colors">
                  Authorize Access
                </a>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] mt-10">
          Onafriq Security Protocol v2.4.0
        </p>
      </div>
    </div>
  );
}