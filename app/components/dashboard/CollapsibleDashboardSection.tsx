"use client";

import {
  ChevronDown,
} from "lucide-react";

import type {
  ReactNode,
} from "react";

type Props = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
};

export default function CollapsibleDashboardSection({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
}: Props) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-[28px] border border-[#d8e9e3] bg-white shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 sm:px-7">
        <div className="flex min-w-0 items-center gap-4">
          {icon ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f5f1] text-2xl">
              {icon}
            </div>
          ) : null}

          <div className="min-w-0">
            <h2 className="text-xl font-black text-[#064b42] sm:text-2xl">
              {title}
            </h2>

            {subtitle ? (
              <p className="mt-1 text-sm leading-5 text-[#6f5a47]">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <ChevronDown
          size={24}
          className="shrink-0 text-[#064b42] transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-[#e7f0ec] px-5 py-6 sm:px-7">
        {children}
      </div>
    </details>
  );
}
