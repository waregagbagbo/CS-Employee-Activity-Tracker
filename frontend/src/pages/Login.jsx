import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/auth";
import { FaEnvelope, FaLock, FaShieldAlt, FaExclamationTriangle } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("AUTHENTICATION FAILED: INVALID CREDENTIALS.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Brand Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FFCC00] opacity-10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF8800] opacity-10 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">

          {/* Header Area */}
          <div className="bg-black pt-12 pb-10 px-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#FFCC00] to-[#FF8800] rounded-[2rem] mb-6 shadow-2xl rotate-3 group">
              <FaShieldAlt className="text-black text-3xl transition-transform group-hover:scale-110" />
            </div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">
              System <span className="text-[#FFCC00]">Access</span>
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-3 opacity-70">
              Onafriq Support Portal
            </p>
          </div>

          <div className="p-10">
            {/* Error Message */}
            {error && (
              <div className="mb-8 bg-rose-50 border border-rose-100 text-rose-700 px-5 py-4 rounded-2xl flex items-center gap-3 animate-shake">
                <FaExclamationTriangle className="flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{error}</span>
              </div>
            )}

            <form onSubmit={handle} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Credentials / Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="email"
                    placeholder="name@onafriq.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FFCC00] transition-all outline-none font-bold text-sm"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Security Code
                </label>
                <div className="relative">
                  <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#FF8800] transition-all outline-none font-bold"
                  />
                </div>
              </div>

              {/* Utility Links */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-[#FFCC00]"
                  />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-black transition-colors">Remember</span>
                </label>
                <a href="#" className="text-[10px] font-black text-[#FF8800] uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                  Reset Key
                </a>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-[#FFCC00] py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-[#FFCC00] hover:text-black transition-all duration-300 disabled:opacity-50 flex items-center justify-center mt-4 group"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="group-hover:scale-105 transition-transform">Authorize Login</span>
                )}
              </button>
            </form>

            {/* Redirect to Register */}
            <div className="mt-10 text-center border-t border-gray-50 pt-8">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                New Personnel?{" "}
                <button
                  onClick={() => navigate("/register")}
                  className="text-black underline decoration-[#FFCC00] decoration-2 underline-offset-4 hover:text-[#FF8800] transition-colors"
                >
                  Request Access
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Legal Footer */}
        <p className="text-center text-[9px] font-black text-gray-500 uppercase tracking-[0.6em] mt-12 opacity-50">
          SECURE ENCRYPTED NODE &copy; 2025 ONAFRIQ CS
        </p>
      </div>
    </div>
  );
}