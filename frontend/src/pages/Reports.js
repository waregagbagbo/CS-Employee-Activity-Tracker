import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { listReports, approveReport, createReport } from "../services/reports";

export default function Reports(){
  const [reports, setReports] = useState([]);

  const load = async () => {
    const res = await listReports();
    setReports(res.data);
  };

  useEffect(()=>{ load(); }, []);

  const handleApprove = async (id) => {
    await approveReport(id);
    load();
  };

  const handleCreate = async () => {
    await createReport({ title: "Test report " + new Date().toISOString(), body: "Auto" });
    load();
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: 12 }}>
        <h2>Reports</h2>
        <button onClick={handleCreate}>Create report</button>
        <ul>
          {reports.map(r => (
            <li key={r.id}>
              {r.title} — {r.status}
              <button onClick={()=>handleApprove(r.id)} style={{marginLeft:8}}>Approve</button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
