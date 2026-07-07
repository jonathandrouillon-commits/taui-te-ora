type StatCardProps = {
  label: string;
  value: string | number;
  icon: string;
};

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="text-4xl">{icon}</div>

      <p className="mt-4 text-sm font-black uppercase text-[#b68b2f]">
        {label}
      </p>

      <p className="mt-2 text-4xl font-black text-[#064b42]">{value}</p>
    </div>
  );
}