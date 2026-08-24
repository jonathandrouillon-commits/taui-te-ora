"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AnimalSwipeCard from "./components/AnimalSwipeCard";
import TauiPageBackground from "./components/ui/TauiPageBackground";
import { animalService } from "./services/animal.service";

export default function HomePage() {
  const [animals, setAnimals] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadAnimals();
  }, []);

  async function loadAnimals() {
    try {
      setLoading(true);

      const data =
        await animalService.getPublishedWithPhotos();

      setAnimals(data || []);
      setCurrentIndex(0);
    } catch (error) {
      console.error(
        "Erreur chargement animaux :",
        error
      );

      setAnimals([]);
    } finally {
      setLoading(false);
    }
  }

  function goNext() {
    setCurrentIndex(
      (previousIndex) =>
        previousIndex + 1
    );
  }

  const currentAnimal =
    animals[currentIndex];

  return (
    <TauiPageBackground>
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden">

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">

          {loading && (
            <div className="flex flex-1 items-center justify-center">
              <div className="rounded-3xl bg-white/90 px-8 py-6 text-center shadow-xl backdrop-blur">

                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#efd5d7] border-t-[#df8995]" />

                <p className="mt-4 font-bold text-[#667568]">
                  Chargement des animaux...
                </p>

              </div>
            </div>
          )}

          {!loading &&
            currentAnimal && (
              <AnimalSwipeCard
                animal={currentAnimal}
                onPass={goNext}
                onFavorite={goNext}
                onMenu={() =>
                  setMenuOpen(true)
                }
              />
            )}

          {!loading &&
            !currentAnimal && (
              <div className="flex flex-1 items-center justify-center px-5">

                <div className="max-w-md rounded-[32px] bg-white/90 p-8 text-center shadow-xl backdrop-blur">

                  <div className="text-6xl">
                    🐾
                  </div>

                  <h2 className="mt-4 text-2xl font-black text-[#667568]">
                    Aucun autre animal à afficher
                  </h2>

                  <p className="mt-3 text-gray-600">
                    Revenez prochainement pour découvrir de nouveaux animaux.
                  </p>

                  <button
                    type="button"
                    onClick={loadAnimals}
                    className="mt-6 rounded-full bg-[#ef919b] px-6 py-3 font-black text-white shadow-lg"
                  >
                    Recommencer
                  </button>

                </div>
              </div>
            )}

        </main>

        <BottomMenu
          onMenu={() =>
            setMenuOpen(true)
          }
        />

        {menuOpen && (
          <InformationMenu
            onClose={() =>
              setMenuOpen(false)
            }
          />
        )}

      </div>
    </TauiPageBackground>
  );
}

function BottomMenu({
  onMenu,
}: {
  onMenu: () => void;
}) {
  return (
    <nav
      className="
        relative
        z-[100]
        w-full
        shrink-0
        border-t
        border-[#eadfd8]
        bg-[#fffaf7]/97
        px-1
        pb-[max(7px,env(safe-area-inset-bottom))]
        pt-2
        shadow-[0_-5px_20px_rgba(50,40,35,.10)]
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto
          grid
          h-[62px]
          w-full
          max-w-[470px]
          grid-cols-5
          items-center
        "
      >

        <NavLink
          href="/"
          label="Accueil"
        >
          <HomeIcon />
        </NavLink>

        <NavLink
          href="/search"
          label="Search"
        >
          <SearchIcon />
        </NavLink>

        {/* SOS */}
        <Link
          href="/signalement"
          aria-label="SOS"
          className="
            relative
            flex
            h-full
            items-center
            justify-center
          "
        >
          <div
            className="
              absolute
              -top-[25px]
              flex
              h-[64px]
              w-[64px]
              items-center
              justify-center
              rounded-full
              border-[5px]
              border-[#fffaf7]
              bg-[#ef5c63]
              text-white
              shadow-[0_6px_16px_rgba(0,0,0,.22)]
            "
          >
            <div className="flex flex-col items-center justify-center leading-none">

              <PawIcon />

              <span className="-mt-[2px] text-[9px] font-black">
                SOS
              </span>

            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={onMenu}
          className="flex h-full flex-col items-center justify-center gap-1 text-[#74766d]"
        >
          <div className="flex h-9 w-9 items-center justify-center">
            <InfoIcon />
          </div>

          <span className="text-[9px] font-semibold uppercase">
            Menu
          </span>
        </button>

        <NavLink
          href="/profile"
          label="Profil"
        >
          <ProfileIcon />
        </NavLink>

      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col items-center justify-center gap-1 text-[#74766d]"
    >
      <div className="flex h-9 w-9 items-center justify-center">
        {children}
      </div>

      <span className="text-[9px] font-semibold uppercase">
        {label}
      </span>
    </Link>
  );
}

function InformationMenu({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div
      className="
        fixed
        inset-0
        z-[300]
        flex
        items-end
        bg-black/30
        backdrop-blur-[2px]
      "
      onClick={onClose}
    >

      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        className="
          mx-auto
          w-full
          max-w-[470px]
          rounded-t-[30px]
          bg-[#fffaf7]
          px-5
          pb-[max(25px,env(safe-area-inset-bottom))]
          pt-4
          shadow-2xl
        "
      >

        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[#d8d0c8]" />

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-xl font-black text-[#514d48]">
              Informations
            </h2>

            <p className="mt-1 text-xs text-[#817a73]">
              Taui Te Ora
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1e9e3] text-xl"
          >
            ×
          </button>

        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">

          <MenuItem
            href="/veterinaires"
            icon="🩺"
          >
            Vétérinaires
          </MenuItem>

          <MenuItem
            href="/association/lesveilleursdekali"
            icon="🐾"
          >
            Les Veilleurs de Kali
          </MenuItem>

          <MenuItem
            href="/toilettage"
            icon="✂️"
          >
            Toilettage
          </MenuItem>

          <MenuItem
            href="/gardiennage"
            icon="🏠"
          >
            Gardiennage
          </MenuItem>

          <MenuItem
            href="/education"
            icon="🎓"
          >
            Éducation
          </MenuItem>

          <MenuItem
            href="/alimentation"
            icon="🥣"
          >
            Alimentation
          </MenuItem>

          <MenuItem
            href="/hommage"
            icon="♡"
          >
            Hommage
          </MenuItem>

          <MenuItem
            href="/associations"
            icon="🤝"
          >
            Associations
          </MenuItem>

        </div>
      </div>
    </div>
  );
}

function MenuItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
        flex
        min-h-[78px]
        items-center
        gap-3
        rounded-[20px]
        bg-white
        p-4
        shadow-sm
        transition
        active:scale-[.98]
      "
    >
      <span className="text-2xl">
        {icon}
      </span>

      <span className="text-sm font-bold leading-tight text-[#625d58]">
        {children}
      </span>
    </Link>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10.5V20h13v-9.5" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-4-4" />
    </svg>
  );
}

function PawIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="currentColor"
    >
      <ellipse
        cx="7"
        cy="7"
        rx="2.2"
        ry="3"
      />

      <ellipse
        cx="17"
        cy="7"
        rx="2.2"
        ry="3"
      />

      <ellipse
        cx="4.5"
        cy="12"
        rx="2"
        ry="2.7"
      />

      <ellipse
        cx="19.5"
        cy="12"
        rx="2"
        ry="2.7"
      />

      <path d="M12 10.5c-3.4 0-6 3.1-6 6 0 2.1 1.5 3.5 3.3 3.5 1 0 1.8-.5 2.7-.5s1.7.5 2.7.5c1.8 0 3.3-1.4 3.3-3.5 0-2.9-2.6-6-6-6Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 11v6" />
      <path d="M12 7h.01" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />

      <path d="M4.5 21c.8-4.1 3.5-6.5 7.5-6.5s6.7 2.4 7.5 6.5" />
    </svg>
  );
}