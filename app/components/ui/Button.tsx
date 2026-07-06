export default function Button({
  children,
  onClick,
  className = "",
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const style =
    variant === "secondary"
      ? "taui-button-secondary"
      : variant === "danger"
      ? "rounded-full bg-red-500 px-6 py-3 font-black text-white shadow transition hover:scale-105"
      : "taui-button";

  return (
    <button onClick={onClick} className={`${style} ${className}`}>
      {children}
    </button>
  );
}