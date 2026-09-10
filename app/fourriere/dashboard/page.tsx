import PublisherDashboard from "../../components/PublisherDashboard";
import DashboardPrivacyAccess from "../../components/dashboard/DashboardPrivacyAccess";

export default function FourriereDashboardPage() {
  return (
    <>
      <DashboardPrivacyAccess />
      <PublisherDashboard expectedRole="fourriere" />
    </>
  );
}