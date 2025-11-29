import React from "react";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  return (
    <>
      <Navbar />
      <div style={{ padding: 20 }}>
        <h2>Dashboard</h2>
        <p>Welcome — use the navbar to manage employees, shifts and reports.</p>
      </div>
    </>
  );
}