import AppTopBar from "../components/ui/AppTopBar";

export default function AdoptionLayout({
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