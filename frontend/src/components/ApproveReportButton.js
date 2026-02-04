// ApproveReportButton.jsx
import { useApproveReport } from "../hooks/useApproveReport";

export default function ApproveReportButton({ id }) {
  const { approve } = useApproveReport();

  return (
    <button onClick={() => approve(id)}>
      Approve
    </button>
  );
}
