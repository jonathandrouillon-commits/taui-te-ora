import PublisherDashboard from "../../components/PublisherDashboard";
import DashboardPrivacyAccess from "../../components/dashboard/DashboardPrivacyAccess";

export default function AssociationDashboardPage() {
  return (
    <>
      <DashboardPrivacyAccess />
      <PublisherDashboard expectedRole="association" />
    </>
  );
}