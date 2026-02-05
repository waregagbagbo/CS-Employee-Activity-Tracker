// ReportTable.jsx
import ApproveReportButton from "./ApproveReportButton";

export default function ReportTable({ reports, showApprove }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Shift</th>
          <th>Tickets</th>
          <th>Status</th>
          {showApprove && <th>Action</th>}
        </tr>
      </thead>
      <tbody>
        {reports.map(r => (
          <tr key={r.id}>
            <td>{r.employee_name}</td>
            <td>{r.shift_type}</td>
            <td>{r.tickets_resolved}</td>
            <td>{r.is_approved ? "Approved" : "Pending"}</td>
            {showApprove && !r.is_approved && (
              <td><ApproveReportButton id={r.id} /></td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
