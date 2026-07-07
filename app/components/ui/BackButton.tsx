"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Props = {
  label?: string;
};

export default function BackButton({
  label = "Retour",
}: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 font-black text-[#064b42] shadow transition hover:scale-[1.02] hover:bg-[#f7f2e8]"
    >
      <ArrowLeft size={22} />
      {label}
    </button>
  );
}