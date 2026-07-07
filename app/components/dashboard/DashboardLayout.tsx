"use client";

import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

type DashboardLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export default function DashboardLayout({
  children,
  title,
  subtitle,
}: DashboardLayoutProps) {
  return (
    <main className="min-h-screen bg-[#f4eee3] text-[#064b42]">
      <div className="flex min-h-screen">
        <DashboardSidebar />

        <section className="flex-1 px-4 py-6 lg:px-8">
          <DashboardHeader title={title} subtitle={subtitle} />
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}