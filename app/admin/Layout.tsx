import AppTopBar from "../components/ui/AppTopBar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppTopBar mode="admin" />
      {children}
    </>
  );
}