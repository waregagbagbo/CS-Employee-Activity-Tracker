// TeamReports.jsx
import { useSupervisorReports } from "../hooks/useSupervisorReports";
import ReportTable from "../components/ReportTable";

export default function TeamReports() {
  const { reports } = useSupervisorReports();
  return <ReportTable reports={reports} showApprove />;
}
