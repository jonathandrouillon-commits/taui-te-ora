type BadgeProps = {
  children: React.ReactNode;
  color?: "green" | "gold" | "red" | "blue";
};

export default function Badge({ children, color = "green" }: BadgeProps) {
  const colors = {
    green: "bg-[#dff5ee] text-[#064b42]",
    gold: "bg-[#fff2cf] text-[#7b5420]",
    red: "bg-[#ffe1e1] text-[#9b2f2f]",
    blue: "bg-[#e1f0ff] text-[#164a7b]",
  };

  return (
    <span className={`rounded-full px-4 py-2 text-sm font-black ${colors[color]}`}>
      {children}
    </span>
  );
}