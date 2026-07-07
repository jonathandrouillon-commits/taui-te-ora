import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[32px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.10)] ${className}`}
    >
      {children}
    </div>
  );
}