export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`taui-card taui-paper p-6 ${className}`}>
      {children}
    </div>
  );
}