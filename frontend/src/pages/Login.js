import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 👇 Check for token on mount
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      navigate("/dashboard"); // auto-redirect if already logged in
    }
  }, [navigate]);

  const handle = async (e) => {
    e.preventDefault();
    try {
      await loginUser(email, password); // saves token
      navigate("/dashboard"); // redirect after login
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto" }}>
      <h2>Login</h2>
      <form onSubmit={handle}>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <button style={{ width: "100%" }}>Login</button>
      </form>
    </div>
  );
}