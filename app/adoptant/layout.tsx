import AppTopBar from "../components/ui/AppTopBar";

export default function AdoptantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppTopBar mode="adoptant" />
      {children}
    </>
  );
}