"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { favoriteService } from "../services/favorite.service";

type FavoriteItem = {
  id: string;
  created_at?: string | null;
  profile_id: string;
  animal_id: string;
  animals?: any;
};

export default function FavoritesPage() {
  const router = useRouter();

  const [favorites, setFavorites] =
    useState<FavoriteItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [removingId, setRemovingId] =
    useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);

      const data =
        await favoriteService.getMine();

      setFavorites(
        (data || []) as FavoriteItem[]
      );
    } catch (error: any) {
      console.error(
        "Erreur chargement coups de cœur :",
        error
      );

      if (
        error?.message ===
        "LOGIN_REQUIRED"
      ) {
        router.push(
          "/login?redirect=" +
            encodeURIComponent(
              "/favorites"
            )
        );

        return;
      }

      alert(
        "Impossible de charger vos animaux coup de cœur."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => void loadFavorites());
  }, [loadFavorites]);

  async function removeFavorite(
    animalId: string
  ) {
    if (!animalId) return;

    try {
      setRemovingId(
        animalId
      );

      await favoriteService.remove(
        animalId
      );

      setFavorites(
        (previous) =>
          previous.filter(
            (favorite) =>
              favorite.animal_id !==
              animalId
          )
      );
    } catch (error) {
      console.error(
        "Erreur suppression coup de cœur :",
        error
      );

      alert(
        "Impossible de retirer cet animal de vos coups de cœur."
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main
      className="
        min-h-[100dvh]
        bg-[#f4eee3]
        px-4
        pb-28
        pt-20
        text-[#064b42]

        sm:px-6
        md:px-8
      "
    >
      <section
        className="
          mx-auto
          w-full
          max-w-6xl
        "
      >
        <div
          className="
            mb-8
            flex
            items-start
            justify-between
            gap-4
          "
        >
          <div>
            <p
              className="
                text-sm
                font-black
                uppercase
                tracking-[0.15em]
                text-[#df8995]
              "
            >
              Mes favoris
            </p>

            <h1
              className="
                mt-1
                text-3xl
                font-black
                text-[#064b42]

                sm:text-4xl
              "
            >
              Animaux coup de cœur
            </h1>

            <p
              className="
                mt-3
                max-w-2xl
                text-sm
                text-[#6f5a47]

                sm:text-base
              "
            >
              Retrouvez ici les animaux
              que vous avez ajoutés à vos
              coups de cœur.
            </p>
          </div>

          <div
            className="
              shrink-0
              rounded-full
              bg-white
              px-4
              py-2
              text-sm
              font-black
              text-[#df687c]
              shadow
            "
          >
            ❤️ {favorites.length}
          </div>
        </div>

        {loading && (
          <div
            className="
              rounded-[30px]
              bg-white
              p-10
              text-center
              shadow
            "
          >
            <div
              className="
                mx-auto
                h-10
                w-10
                animate-spin
                rounded-full
                border-4
                border-[#efd5d7]
                border-t-[#df8995]
              "
            />

            <p
              className="
                mt-4
                font-bold
                text-[#6f5a47]
              "
            >
              Chargement de vos coups de cœur...
            </p>
          </div>
        )}

        {!loading &&
          favorites.length === 0 && (
            <div
              className="
                rounded-[32px]
                bg-white
                p-10
                text-center
                shadow
              "
            >
              <div className="text-6xl">
                ❤️
              </div>

              <h2
                className="
                  mt-4
                  text-2xl
                  font-black
                  text-[#064b42]
                "
              >
                Aucun coup de cœur
              </h2>

              <p
                className="
                  mx-auto
                  mt-3
                  max-w-md
                  text-[#6f5a47]
                "
              >
                Les animaux que vous ajoutez
                en coup de cœur apparaîtront ici.
              </p>

              <Link
                href="/"
                className="
                  mt-7
                  inline-flex
                  rounded-full
                  bg-[#ef8196]
                  px-7
                  py-3
                  font-black
                  text-white
                  shadow-lg
                "
              >
                Découvrir les animaux
              </Link>
            </div>
          )}

        {!loading &&
          favorites.length > 0 && (
            <div
              className="
                grid
                grid-cols-1
                gap-5

                sm:grid-cols-2
                lg:grid-cols-3
              "
            >
              {favorites.map(
                (favorite) => (
                  <FavoriteCard
                    key={
                      favorite.id
                    }
                    favorite={
                      favorite
                    }
                    removing={
                      removingId ===
                      favorite.animal_id
                    }
                    onRemove={() =>
                      removeFavorite(
                        favorite.animal_id
                      )
                    }
                  />
                )
              )}
            </div>
          )}
      </section>
    </main>
  );
}

function FavoriteCard({
  favorite,
  removing,
  onRemove,
}: {
  favorite: FavoriteItem;
  removing: boolean;
  onRemove: () => void;
}) {
  const animal =
    favorite.animals;

  const photos =
    Array.isArray(
      animal?.animal_photos
    )
      ? animal.animal_photos
      : [];

  const cover =
    photos.find(
      (photo: any) =>
        photo?.is_cover
    );

  const coverPhoto =
    cover?.photo_url ||
    photos[0]?.photo_url ||
    "";

  const animalName =
    animal?.animal_name ||
    animal?.nom ||
    "Animal";

  const type =
    animal?.animal_type ||
    animal?.type ||
    "";

  const age =
    animal?.age_label ||
    animal?.age ||
    "";

  const sex =
    animal?.sex ||
    animal?.sexe ||
    "";

  const island =
    animal?.island ||
    animal?.ile ||
    "";

  const city =
    animal?.city ||
    animal?.localisation ||
    "";

  const location =
    [city, island]
      .filter(Boolean)
      .join(" · ");

  return (
    <article
      className="
        overflow-hidden
        rounded-[30px]
        bg-white
        shadow-lg
      "
    >
      <Link
        href={`/animal/${favorite.animal_id}`}
        className="block"
      >
        <div
          className="
            relative
            aspect-[4/3]
            w-full
            overflow-hidden
            bg-[#eadfd8]
          "
        >
          {coverPhoto ? (
            <img
              src={
                coverPhoto
              }
              alt={
                animalName
              }
              className="
                h-full
                w-full
                object-cover
                transition
                duration-300
                hover:scale-[1.03]
              "
            />
          ) : (
            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                text-6xl
              "
            >
              🐾
            </div>
          )}

          <div
            className="
              absolute
              right-3
              top-3
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-white/90
              text-xl
              shadow
              backdrop-blur
            "
          >
            ❤️
          </div>
        </div>
      </Link>

      <div className="p-5">
        <h2
          className="
            text-2xl
            font-black
            text-[#064b42]
          "
        >
          {animalName}
        </h2>

        <div
          className="
            mt-2
            flex
            flex-wrap
            gap-2
          "
        >
          {type && (
            <InfoBadge>
              {type}
            </InfoBadge>
          )}

          {sex && (
            <InfoBadge>
              {sex}
            </InfoBadge>
          )}

          {age && (
            <InfoBadge>
              {age}
            </InfoBadge>
          )}
        </div>

        {location && (
          <p
            className="
              mt-4
              text-sm
              font-semibold
              text-[#6f5a47]
            "
          >
            📍 {location}
          </p>
        )}

        <div
          className="
            mt-5
            grid
            grid-cols-1
            gap-3

            sm:grid-cols-2
          "
        >
          <Link
            href={`/animal/${favorite.animal_id}`}
            className="
              flex
              items-center
              justify-center
              rounded-full
              bg-[#064b42]
              px-5
              py-3
              text-sm
              font-black
              text-white
              transition
              hover:bg-[#0a6659]
            "
          >
            Voir le profil
          </Link>

          <button
            type="button"
            onClick={
              onRemove
            }
            disabled={
              removing
            }
            className="
              rounded-full
              border
              border-[#efd5d7]
              bg-[#fff7f8]
              px-5
              py-3
              text-sm
              font-black
              text-[#df687c]
              transition
              hover:bg-[#fdecef]
              disabled:opacity-50
            "
          >
            {removing
              ? "Suppression..."
              : "Retirer"}
          </button>
        </div>
      </div>
    </article>
  );
}

function InfoBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span
      className="
        rounded-full
        bg-[#f8f4ec]
        px-3
        py-1
        text-xs
        font-bold
        text-[#6f5a47]
      "
    >
      {children}
    </span>
  );
}