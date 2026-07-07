import AppTopBar from "../components/ui/AppTopBar";

export default function AssociationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppTopBar mode="association" />
      {children}
    </>
  );
}