import React, { useEffect, useState, useCallback } from "react";
import AttendanceService from "../services/attendance";
import ShiftService from "../services/shifts";
import { FaClock, FaStop } from "react-icons/fa";
import useLiveTimer from "../hooks/useClockTimer";

export default function AttendanceClock({ userType }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [availableShifts, setAvailableShifts] = useState([]);

  const isEmployee = userType === "employee_agent";

  const loadStatus = useCallback(async () => {
    try {
      const data = await AttendanceService.getStatus();
      setStatus(data);
    } catch (err) {
      console.error("Attendance status error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEmployee) {
      loadStatus();
      fetchShifts();
    }
  }, [isEmployee, loadStatus]);

  const fetchShifts = async () => {
    try {
      const res = await ShiftService.getMyShifts();
      setAvailableShifts(res.shifts || []);
    } catch (err) {
      console.error("Shift fetch error", err);
    }
  };

  const elapsed = useLiveTimer(status?.clock_in_time);

  const handleClockIn = async (shiftId) => {
    setActionLoading(true);
    try {
      const res = await AttendanceService.clockIn({ shift_id: shiftId });
      // ✅ update status so Assigned shift shows immediately
      setStatus(res);
    } catch (err) {
      console.error("Clock-in failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      const res = await AttendanceService.clockOut();
      setStatus(res);
    } catch (err) {
      console.error("Clock-out failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isEmployee) return null;
  if (loading) return <div className="p-6 text-sm text-gray-400">Loading attendance...</div>;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <FaClock className="text-[#FFCC00]" />
        <h3 className="font-black uppercase tracking-widest text-xs">Live Attendance</h3>
      </div>

      <div className="text-3xl font-black mb-4 tabular-nums">
        {status?.is_clocked_in ? elapsed : "00:00:00"}
      </div>

      {/* Assigned Shift */}
      {status?.shift ? (
        <div className="mb-4 text-sm text-gray-600">
          <p className="font-bold uppercase">Assigned Shift</p>
          <p>
            {status.shift.shift_type_display || status.shift.shift_type} (
            {status.shift.shift_start_time} - {status.shift.shift_end_time})
          </p>
        </div>
      ) : (
        <div className="mb-4 text-sm text-gray-400">
          <p className="font-bold uppercase">Assigned Shift</p>
          <p>No shift assigned yet</p>
          <ul className="mt-2 space-y-2">
            {availableShifts.map((shift) => (
              <li key={shift.id} className="flex justify-between items-center">
                <span>
                  {shift.shift_type_display || shift.shift_type} (
                  {shift.shift_start_time} - {shift.shift_end_time})
                </span>
                <button
                  onClick={() => handleClockIn(shift.id)}
                  disabled={actionLoading}
                  className="px-3 py-1 text-xs font-black rounded bg-[#FFCC00] text-black hover:scale-[1.05] transition-transform"
                >
                  Clock In Here
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Clock Out Button */}
      {status?.is_clocked_in && (
        <button
          onClick={handleClockOut}
          disabled={actionLoading}
          className="w-full py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] bg-black text-[#FFCC00]"
        >
          <FaStop /> CLOCK OUT
        </button>
      )}
    </div>
  );
}
