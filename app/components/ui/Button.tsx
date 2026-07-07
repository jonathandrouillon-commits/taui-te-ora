import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "gold" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  full?: boolean;
};

export default function Button({
  children,
  variant = "primary",
  full = false,
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-[#6E7E5D] text-white hover:bg-[#4B5A3D]",
    secondary: "bg-[#D67B52] text-white hover:bg-[#bf6744]",
    gold: "bg-[#D8A33A] text-white hover:bg-[#bd8d2d]",
    ghost: "bg-[#F7F2E8] text-[#304032] hover:bg-[#E6DDCF]",
    danger: "bg-red-100 text-red-700 hover:bg-red-200",
  };

  return (
    <button
      {...props}
      className={`rounded-[22px] px-5 py-3 font-black shadow transition disabled:opacity-60 ${
        variants[variant]
      } ${full ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}