import { ReactNode } from "react";

type BadgeVariant = "green" | "orange" | "gold" | "cream";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
};

export default function Badge({ children, variant = "green" }: BadgeProps) {
  const variants = {
    green: "bg-[#6E7E5D] text-white",
    orange: "bg-[#D67B52] text-white",
    gold: "bg-[#D8A33A] text-white",
    cream: "bg-[#F7F2E8] text-[#304032]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-black uppercase ${variants[variant]}`}
    >
      {children}
    </span>
  );
}