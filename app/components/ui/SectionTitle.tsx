export default function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h2 className="taui-section-title">
      <span>🐾</span>
      {children}
    </h2>
  );
}