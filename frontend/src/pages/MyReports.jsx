// MyReports.jsx
import { useMyReports } from "../hooks/useMyReports";
import ReportTable from "../components/ReportTable";

export default function MyReports() {
  const { reports, loading } = useMyReports();

  if (loading) return <p>Loading...</p>;

  return <ReportTable reports={reports} />;
}
