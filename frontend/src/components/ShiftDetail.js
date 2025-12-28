import API from "../services/api";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ShiftDetail = () => {
  const { id } = useParams(); // shift id
  const [shift, setShift] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShiftAndReports();
  }, []);

  const loadShiftAndReports = async () => {
    try {
      // 1. Fetch shift (permission-safe)
      const shiftRes = await API.get(`cs/shifts/${id}/`);
      const shiftData = shiftRes.data;
      setShift(shiftData);

      // 2. Fetch reports (already filtered by DRF)
      const reportsRes = await API.get(`cs/reports/`);
      const allReports = reportsRes.data.results || reportsRes.data;

      // 3. Attach reports to THIS shift (UI-level filtering)
      const attachedReports = allReports.filter((report) => {
        return (
          report.shift_active_agent?.id === shiftData.shift_agent?.id &&
          report.created_at?.startsWith(shiftData.shift_date)
        );
      });

      setReports(attachedReports);
    } catch (err) {
      console.error("Error loading shift detail", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!shift) return <p>Shift not found</p>;

  return (
    <div>
      <h2>Shift Detail</h2>

      <p><strong>Date:</strong> {shift.shift_date}</p>
      <p><strong>Status:</strong> {shift.shift_status}</p>
      <p><strong>Agent:</strong> {shift.shift_agent?.user?.username}</p>

      <hr />

      <h3>Activity Reports</h3>

      {reports.length === 0 ? (
        <p>No reports for this shift.</p>
      ) : (
        reports.map((report) => (
          <div key={report.id} style={{ border: "1px solid #ddd", padding: 10, marginBottom: 10 }}>
            <p><strong>Type:</strong> {report.activity_type}</p>
            <p><strong>Status:</strong> {report.activity_status}</p>
            <p><strong>Description:</strong> {report.description}</p>

            {report.is_approved !== undefined && (
              <p>
                <strong>Approved:</strong>{" "}
                {report.is_approved ? "Yes" : "No"}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ShiftDetail;
