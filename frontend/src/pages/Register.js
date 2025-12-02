import { useState } from "react";
import { registerUser } from "../services/auth";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirmation: "",
  });

  const [status, setStatus] = useState("");

  const updateField = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (form.password !== form.password_confirmation) {
      setStatus("Passwords do not match.");
      return;
    }

    try {
      await registerUser(form);
      setStatus("Account created successfully! Redirecting...");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);

    } catch (err) {
      console.error(err);
      setStatus("Registration failed. Check your details.");
    }
  };

  return (
    <div style={{ width: 400, margin: "60px auto" }}>
      <h2>Create Account</h2>

      <form onSubmit={handleRegister}>

        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={updateField}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={updateField}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <input
          name="first_name"
          placeholder="First Name"
          value={form.first_name}
          onChange={updateField}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <input
          name="last_name"
          placeholder="Last Name"
          value={form.last_name}
          onChange={updateField}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={updateField}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <input
          name="password_confirmation"
          type="password"
          placeholder="Confirm Password"
          value={form.password_confirmation}
          onChange={updateField}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <button style={{ width: "100%" }}>Register</button>
      </form>

      <p style={{ marginTop: 10, fontWeight: "bold" }}>{status}</p>

      <p>
        Already have an account? <a href="/">Login</a>
      </p>
    </div>
  );
}
