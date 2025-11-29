import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { listShifts, startShift, endShift, createShift } from "../services/shifts";

export default function Shifts() {
  const [shifts, setShifts] = useState([]);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const res = await listShifts();
    setShifts(res.data);
  };

  useEffect(()=>{ load(); }, []);

  const handleStart = async (id) => {
    await startShift(id);
    load();
  };

  const handleEnd = async (id) => {
    await endShift(id);
    load();
  };

  const handleCreate = async () => {
    setCreating(true);
    await createShift({ title: "Auto shift - " + new Date().toISOString() });
    setCreating(false);
    load();
  };

  return (
    <>
      <Navbar />
      <div style={{ padding: 12 }}>
        <h2>Shifts</h2>
        <button onClick={handleCreate} disabled={creating}>Create shift</button>
        <ul>
          {shifts.map(s => (
            <li key={s.id}>
              {s.title} — {s.status}
              <button onClick={()=>handleStart(s.id)} style={{marginLeft:8}}>Start</button>
              <button onClick={()=>handleEnd(s.id)} style={{marginLeft:8}}>End</button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
