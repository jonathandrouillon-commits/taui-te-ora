export default function StatCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[28px] bg-white p-6 shadow-md">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b58b5b]">
        {title}
      </p>

      <p className="mt-4 text-4xl font-bold text-[#2f241c]">{value}</p>
    </div>
  );
}
