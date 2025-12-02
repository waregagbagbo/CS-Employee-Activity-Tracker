import React, { useState } from "react";
import { loginUser } from "../services/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    try {
      await loginUser(email, password);
      window.location.href = "/dashboard";
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto" }}>
      <h2>Login</h2>
      <form onSubmit={handle}>
        <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%", marginBottom:8}}/>
        <input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%", marginBottom:8}}/>
        <button style={{width:"100%"}}>Login</button>
      </form>
    </div>
  );
}
