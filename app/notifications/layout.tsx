import AppTopBar from "../components/ui/AppTopBar";

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppTopBar mode="public" />
      {children}
    </>
  );
}