"use client";

import { useRouter } from "next/navigation";

import {
  Heart,
  Home,
  PawPrint,
  Search,
  Shield,
  User,
  Users,
  Building2,
  ArrowLeft,
} from "lucide-react";

import NotificationBell from "./NotificationBell";

type Props = {
  mode?: "public" | "association" | "admin" | "adoptant" | "refuge";
};

export default function AppTopBar({
  mode = "public",
}: Props) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-white/95 shadow-lg backdrop-blur">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4">

        {/* =====================================================
            MOBILE
        ====================================================== */}

        <div className="flex flex-col gap-3 md:hidden">

          {/* PREMIERE LIGNE : RETOUR + LOGO */}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Retour"
              className="
                flex
                h-12
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-full
                bg-white
                px-4
                font-black
                text-[#064b42]
                shadow-md
                transition
                active:scale-95
              "
            >
              <ArrowLeft size={22} />

              <span>
                Retour
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="
                flex
                min-w-0
                flex-1
                items-center
                justify-end
                gap-2
              "
            >
              <PawPrint
                size={25}
                className="shrink-0 text-[#064b42]"
              />

              <div className="min-w-0 text-right">
                <div className="truncate text-sm font-black text-[#064b42]">
                  TAUI TE ORA
                </div>

                <div className="truncate text-[10px] text-gray-500">
                  Changer une vie
                </div>
              </div>
            </button>
          </div>

          {/* DEUXIEME LIGNE : NAVIGATION */}

          <div
            className="
              flex
              w-full
              items-center
              justify-center
              gap-2
              overflow-x-auto
              pb-1
            "
          >
            <IconButton
              onClick={() => router.push("/")}
              icon={<Home size={20} />}
              tooltip="Accueil"
              mobile
            />

            <IconButton
              onClick={() => router.push("/search")}
              icon={<Search size={20} />}
              tooltip="Recherche"
              mobile
            />

            <IconButton
              onClick={() => router.push("/favorites")}
              icon={<Heart size={20} />}
              tooltip="Favoris"
              mobile
            />

            <div className="shrink-0">
              <NotificationBell />
            </div>

            <IconButton
              onClick={() => router.push("/profile")}
              icon={<User size={20} />}
              tooltip="Mon profil"
              mobile
            />

            {mode === "association" && (
              <IconButton
                onClick={() =>
                  router.push("/association/dashboard")
                }
                icon={<Users size={20} />}
                tooltip="Association"
                mobile
              />
            )}

            {mode === "refuge" && (
              <IconButton
                onClick={() =>
                  router.push("/refuge/dashboard")
                }
                icon={<Building2 size={20} />}
                tooltip="Refuge"
                mobile
              />
            )}

            {mode === "admin" && (
              <IconButton
                onClick={() =>
                  router.push("/admin/dashboard")
                }
                icon={<Shield size={20} />}
                tooltip="Administration"
                mobile
              />
            )}
          </div>
        </div>

        {/* =====================================================
            TABLETTE / PC
        ====================================================== */}

        <div className="hidden items-center justify-between gap-4 md:flex">

          {/* LOGO */}

          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex min-w-0 items-center gap-3"
          >
            <PawPrint
              size={28}
              className="shrink-0 text-[#064b42]"
            />

            <div className="min-w-0 text-left">
              <div className="truncate font-black text-[#064b42]">
                TAUI TE ORA
              </div>

              <div className="truncate text-xs text-gray-500">
                Changer une vie
              </div>
            </div>
          </button>

          {/* MENU */}

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

            <NotificationBell />

            <IconButton
              onClick={() => router.push("/profile")}
              icon={<User size={20} />}
              tooltip="Mon profil"
            />

            {mode === "association" && (
              <IconButton
                onClick={() =>
                  router.push("/association/dashboard")
                }
                icon={<Users size={20} />}
                tooltip="Association"
              />
            )}

            {mode === "refuge" && (
              <IconButton
                onClick={() =>
                  router.push("/refuge/dashboard")
                }
                icon={<Building2 size={20} />}
                tooltip="Refuge"
              />
            )}

            {mode === "admin" && (
              <IconButton
                onClick={() =>
                  router.push("/admin/dashboard")
                }
                icon={<Shield size={20} />}
                tooltip="Administration"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   BOUTON ICONE
========================================================= */

function IconButton({
  icon,
  onClick,
  tooltip,
  mobile = false,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  tooltip: string;
  mobile?: boolean;
}) {
  return (
    <button
      type="button"
      title={tooltip}
      aria-label={tooltip}
      onClick={onClick}
      className={`
        flex
        shrink-0
        items-center
        justify-center
        rounded-full
        bg-[#f5ead8]
        text-[#064b42]
        transition
        hover:bg-[#ead9bb]
        active:scale-95
        ${
          mobile
            ? "h-11 w-11"
            : "h-11 w-11 hover:scale-105"
        }
      `}
    >
      {icon}
    </button>
  );
}