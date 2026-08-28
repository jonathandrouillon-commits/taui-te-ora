"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { supabase } from "../lib/supabase";

function getProfileDestination(role: unknown) {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");

  switch (normalizedRole) {
    case "admin":
    case "administrateur":
      return "/admin/dashboard";

    case "association":
      return "/association/dashboard";

    case "refuge":
      return "/refuge/dashboard";

    case "fourriere":
      return "/fourriere/dashboard";

    case "benevole":
    case "famille_accueil":
    case "famille_d_accueil":
      return "/benevole/dashboard";

    case "adoptant":
    case "utilisateur":
      return "/dashboard";

    default:
      return "/profile";
  }
}

export default function BottomNavigation() {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);

  const [profileHref, setProfileHref] =
    useState("/profile");

  const [profilePhoto, setProfilePhoto] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active || !user) {
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("role, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error(
            "Erreur chargement profil bottom navigation :",
            error
          );
        }

        if (!active) {
          return;
        }

        setProfileHref(
          getProfileDestination(
            data?.role ?? user.user_metadata?.role
          )
        );

        const avatar =
          data?.avatar_url ||
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null;

        setProfilePhoto(
          typeof avatar === "string" && avatar.trim()
            ? avatar.trim()
            : null
        );
      } catch (error) {
        console.error(
          "Erreur chargement profil bottom navigation :",
          error
        );
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  // Sur l'accueil, on masque cette navigation
  // car la barre principale est directement intégrée dans app/page.tsx
  if (pathname === "/") {
    return null;
  }

  const mainItems = [
    {
      href: "/",
      label: "Accueil",
      icon: "🏠",
    },
    {
      href: "/search",
      label: "Search",
      icon: "🔎",
    },
    {
      href: "/signalement",
      label: "SOS",
      icon: "/sos-paw.png",
      sos: true,
    },
    {
      href: "#",
      label: "Menu",
      icon: "☰",
      menu: true,
    },
    {
      href: profileHref,
      label: "Profil",
      icon: "👤",
      profile: true,
    },
  ];

  const menuItems = [
    {
      href: "/arpap",
      label: "ARPAP",
      icon: "🐾",
    },
    {
      href: "/info",
      label: "Info",
      icon: "ℹ️",
    },
    {
      href: "/veterinaires",
      label: "Vétérinaires",
      icon: "🩺",
    },
    {
      href: "/conseils-sante",
      label: "Conseils santé",
      icon: "❤️‍🩹",
    },
    {
      href: "/association",
      label: "Les Veilleurs de Kali",
      icon: "❤️",
    },
    {
      href: "/boutique",
      label: "Boutique",
      icon: "🛍️",
    },
    {
      href: "/toilettage",
      label: "Toilettage",
      icon: "✂️",
    },
    {
      href: "/gardiennage",
      label: "Gardiennage",
      icon: "🏡",
    },
    {
      href: "/education",
      label: "Éducation",
      icon: "🎓",
    },
    {
      href: "/alimentation",
      label: "Alimentation",
      icon: "🥣",
    },
    {
      href: "/hommage",
      label: "Hommage à Kali",
      icon: "🐾",
    },
  ];

  function toggleMenu() {
    setMenuOpen(
      (previousValue) => !previousValue
    );
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={closeMenu}
            className="fixed inset-0 z-[200] cursor-default bg-black/40"
          />

          <div className="fixed bottom-[82px] left-1/2 z-[210] max-h-[70vh] w-[calc(100%-24px)] max-w-lg -translate-x-1/2 overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex justify-center pt-3">
              <div className="h-1.5 w-14 rounded-full bg-gray-300" />
            </div>

            <div className="relative px-5 pb-5 pt-4">
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Fermer le menu"
                className="absolute right-4 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f8f4ec] text-lg font-black text-[#064b42] shadow-sm"
              >
                ✕
              </button>

              <h2 className="mb-5 text-center text-xl font-black text-[#064b42]">
                Menu
              </h2>

              <div className="max-h-[52vh] space-y-2 overflow-y-auto pb-2">
                {menuItems.map((item) => {
                  const isMenuItemActive =
                    pathname === item.href ||
                    pathname.startsWith(
                      `${item.href}/`
                    );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm transition active:scale-[0.98] ${
                        isMenuItemActive
                          ? "bg-[#e8f5f1]"
                          : "bg-[#f8f4ec]"
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                        {item.icon}
                      </span>

                      <span className="text-base font-black text-[#064b42]">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-[220] border-t border-[#eadfce] bg-white/95 px-2 pb-2 pt-1 shadow-[0_-6px_24px_rgba(0,0,0,0.12)] backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-1 pb-1 pt-1">
          {mainItems.map((item) => {
            const isActive =
              item.href !== "#" &&
              (pathname === item.href ||
                (item.href !== "/" &&
                  pathname.startsWith(
                    `${item.href}/`
                  )));

            if (item.menu) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={toggleMenu}
                  aria-expanded={menuOpen}
                  aria-label={
                    menuOpen
                      ? "Fermer le menu"
                      : "Ouvrir le menu"
                  }
                  className="flex flex-col items-center justify-center gap-0.5"
                >
                  <span
                    className={`text-[24px] leading-none ${
                      menuOpen
                        ? "text-[#064b42]"
                        : "text-[#6f7b63]"
                    }`}
                  >
                    {menuOpen
                      ? "✕"
                      : item.icon}
                  </span>

                  <span
                    className={`text-[9px] font-black uppercase leading-none ${
                      menuOpen
                        ? "text-[#064b42]"
                        : "text-[#6f7b63]"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            if (item.sos) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label="Signaler un animal"
                  className="relative -mt-5 flex items-center justify-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#dc7a4b] shadow-xl ring-[3px] ring-white">
                    <img
                      src="/sos-paw.png"
                      alt="SOS"
                      className="h-11 w-11 object-contain"
                    />
                  </span>
                </Link>
              );
            }

            if (item.profile) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-0.5"
                >
                  {profilePhoto ? (
                    <span
                      className={`flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-full border-2 ${
                        isActive
                          ? "border-[#064b42]"
                          : "border-[#d9d2c6]"
                      } bg-[#f8f4ec]`}
                    >
                      <img
                        src={profilePhoto}
                        alt="Photo de profil"
                        className="h-full w-full object-cover"
                      />
                    </span>
                  ) : (
                    <span className="text-[24px] leading-none">
                      👤
                    </span>
                  )}

                  <span
                    className={`text-[9px] font-black uppercase leading-none ${
                      isActive
                        ? "text-[#064b42]"
                        : "text-[#6f7b63]"
                    }`}
                  >
                    Profil
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5"
              >
                <span className="text-[24px] leading-none">
                  {item.icon}
                </span>

                <span
                  className={`text-[9px] font-black uppercase leading-none ${
                    isActive
                      ? "text-[#064b42]"
                      : "text-[#6f7b63]"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
