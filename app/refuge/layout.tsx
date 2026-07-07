import AppTopBar from "../components/ui/AppTopBar";

export default function RefugeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppTopBar mode="refuge" />
      {children}
    </>
  );
}