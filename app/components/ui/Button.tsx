type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger";
  className?: string;
};

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
}: ButtonProps) {
  const styles = {
    primary: "bg-[#064b42] text-white hover:bg-[#0b6d5e]",
    secondary: "bg-white text-[#064b42] hover:bg-[#f5efe5]",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-2xl px-6 py-4 font-black shadow-lg transition ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}