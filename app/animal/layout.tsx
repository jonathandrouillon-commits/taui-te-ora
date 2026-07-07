import AppTopBar from "../components/ui/AppTopBar";

export default function AnimalLayout({
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