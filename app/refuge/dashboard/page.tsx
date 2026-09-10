import PublisherDashboard from "../../components/PublisherDashboard";
import DashboardPrivacyAccess from "../../components/dashboard/DashboardPrivacyAccess";

export default function RefugeDashboardPage() {
  return (
    <>
      <DashboardPrivacyAccess />
      <PublisherDashboard expectedRole="refuge" />
    </>
  );
}