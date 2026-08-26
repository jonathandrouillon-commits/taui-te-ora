"use client";

import Link from "next/link";

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
    <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <StatCard icon="❤️" title="Likes" value={likesCount} />

      <StatCard
        icon="📄"
        title="Questionnaire"
        value={questionnaireFilled ? "Rempli" : "Vide"}
      />

      <StatCard icon="🐶" title="Demandes" value={adoptionRequestsCount} />

      <StatCard icon="🔔" title="Notifications" value={notificationsCount} />

      <StatCard
        icon="💬"
        title="Messages"
        value="Ouvrir"
        href="/messages"
      />
    </section>
  );
}

function StatCard({
  icon,
  title,
  value,
  href,
}: {
  icon: string;
  title: string;
  value: string | number;
  href?: string;
}) {
  const content = (
    <div className="rounded-[1.7rem] bg-white p-5 text-center shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="text-3xl">{icon}</div>

      <div className="mt-2 text-2xl font-bold text-[#2f241c]">
        {value}
      </div>

      <div className="text-sm text-[#6f5a47]">{title}</div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
