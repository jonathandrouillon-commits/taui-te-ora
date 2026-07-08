"use client";

type DashboardStatsProps = {
  likesCount: number;
  questionnaireFilled: boolean;
  adoptionRequestsCount?: number;
  notificationsCount?: number;
};

export default function DashboardStats({
  likesCount,
  questionnaireFilled,
  adoptionRequestsCount = 0,
  notificationsCount = 0,
}: DashboardStatsProps) {
  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard icon="❤️" title="Likes" value={likesCount} />

      <StatCard
        icon="📄"
        title="Questionnaire"
        value={questionnaireFilled ? "Rempli" : "Vide"}
      />

      <StatCard icon="🐶" title="Demandes" value={adoptionRequestsCount} />

      <StatCard icon="🔔" title="Notifications" value={notificationsCount} />
    </section>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.7rem] bg-white p-5 text-center shadow-md">
      <div className="text-3xl">{icon}</div>

      <div className="mt-2 text-2xl font-bold text-[#2f241c]">
        {value}
      </div>

      <div className="text-sm text-[#6f5a47]">
        {title}
      </div>
    </div>
  );
}