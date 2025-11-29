import React from "react";
import { logoutUser } from "../services/auth";

export default function Navbar() {
  return (
    <nav style={{ padding: 10, background: "#f3f3f3" }}>
      <a href="/dashboard" style={{ marginRight: 12 }}>Dashboard</a>
      <a href="/employees" style={{ marginRight: 12 }}>Employees</a>
      <a href="/shifts" style={{ marginRight: 12 }}>Shifts</a>
      <a href="/reports" style={{ marginRight: 12 }}>Reports</a>
      <button style={{ float: "right" }} onClick={logoutUser}>Logout</button>
    </nav>
  );
}
