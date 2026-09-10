import PublisherDashboard from "../../components/PublisherDashboard";
import DashboardPrivacyAccess from "../../components/dashboard/DashboardPrivacyAccess";

export default function BenevoleDashboardPage() {
  return (
    <>
      <DashboardPrivacyAccess />
      <PublisherDashboard expectedRole="benevole" />
    </>
  );
}