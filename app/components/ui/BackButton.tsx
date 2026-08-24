"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Props = {
  label?: string;
  fallback?: string;
};

export default function BackButton({
  label = "Retour",
  fallback = "/",
}: Props) {
  const router = useRouter();

  function handleBack() {
    if (
      typeof window !== "undefined" &&
      window.history.length > 1
    ) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="
        inline-flex
        items-center
        gap-2
        rounded-2xl
        bg-white
        px-4
        py-2.5
        font-black
        text-[#064b42]
        shadow
        transition
        hover:scale-[1.02]
        hover:bg-[#f7f2e8]
        active:scale-[0.98]

        sm:gap-3
        sm:px-5
        sm:py-3
      "
    >
      <ArrowLeft size={22} />

      <span>{label}</span>
    </button>
  );
}