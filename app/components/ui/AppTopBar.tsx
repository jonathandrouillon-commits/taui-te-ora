"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Heart,
  Home,
  PawPrint,
  Search,
  Shield,
  User,
  Users,
  Building2,
} from "lucide-react";

type Props = {
  mode?: "public" | "association" | "admin" | "adoptant" | "refuge";
};

export default function AppTopBar({
  mode = "public",
}: Props) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-[#f4eee3]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between bg-white px-4 py-3 shadow-lg">

        {/* Retour */}
        <button
          onClick={() => router.back()}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5ead8] hover:bg-[#ead9bb]"
        >
          <ArrowLeft size={22} />
        </button>

        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3"
        >
          <PawPrint size={28} className="text-[#064b42]" />

          <div className="text-left">
            <div className="font-black text-[#064b42]">
              TAUI TE ORA
            </div>

            <div className="text-xs text-gray-500">
              Changer une vie
            </div>
          </div>
        </button>

        {/* Menu */}
        <div className="flex items-center gap-2">

          <IconButton
            onClick={() => router.push("/")}
            icon={<Home size={20} />}
            tooltip="Accueil"
          />

          <IconButton
            onClick={() => router.push("/search")}
            icon={<Search size={20} />}
            tooltip="Recherche"
          />

          <IconButton
            onClick={() => router.push("/favorites")}
            icon={<Heart size={20} />}
            tooltip="Favoris"
          />

          <IconButton
            onClick={() => router.push("/notifications")}
            icon={<Bell size={20} />}
            tooltip="Notifications"
          />

          <IconButton
            onClick={() => router.push("/profile")}
            icon={<User size={20} />}
            tooltip="Mon profil"
          />

          {mode === "association" && (
            <IconButton
              onClick={() => router.push("/association/dashboard")}
              icon={<Users size={20} />}
              tooltip="Association"
            />
          )}

          {mode === "refuge" && (
            <IconButton
              onClick={() => router.push("/refuge/dashboard")}
              icon={<Building2 size={20} />}
              tooltip="Refuge"
            />
          )}

          {mode === "admin" && (
            <IconButton
              onClick={() => router.push("/admin/dashboard")}
              icon={<Shield size={20} />}
              tooltip="Administration"
            />
          )}
        </div>
      </div>
    </header>
  );
}

function IconButton({
  icon,
  onClick,
  tooltip,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  tooltip: string;
}) {
  return (
    <button
      type="button"
      title={tooltip}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5ead8] text-[#064b42] transition hover:scale-105 hover:bg-[#ead9bb]"
    >
      {icon}
    </button>
  );
}