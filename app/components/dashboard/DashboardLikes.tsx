"use client";

import Link from "next/link";
import type {
  Like,
} from "../../lib/dashboard";

type DashboardLikesProps = {
  likes: Like[];
};

export default function DashboardLikes({
  likes,
}: DashboardLikesProps) {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-md">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#2f241c]">
          Animaux coup de cœur ❤️
        </h2>

        {likes.length > 0 && (
          <Link
            href="/favorites"
            className="text-sm font-bold text-[#df687c]"
          >
            Voir tous
          </Link>
        )}
      </div>

      {likes.length === 0 ? (
        <div className="rounded-2xl bg-[#f8f4ec] p-5">
          <p className="text-[#6f5a47]">
            Tu n&apos;as pas encore ajouté
            d&apos;animal à tes coups de cœur.
          </p>

          <Link
            href="/"
            className="mt-5 inline-block rounded-full bg-[#9c7b54] px-5 py-3 text-sm font-semibold text-white"
          >
            Découvrir les animaux
          </Link>
        </div>
      ) : (
        <div
          className="
            grid
            gap-4

            sm:grid-cols-2
            lg:grid-cols-3
          "
        >
          {likes.map(
            (like) => {
              const animal =
                like.animals;

              const photos =
                Array.isArray(
                  animal?.animal_photos
                )
                  ? animal
                      ?.animal_photos
                  : [];

              const cover =
                photos.find(
                  (photo) =>
                    photo.is_cover
                ) ||
                photos[0];

              const photoUrl =
                cover?.photo_url ||
                "";

              return (
                <article
                  key={
                    like.id
                  }
                  className="
                    overflow-hidden
                    rounded-[24px]
                    border
                    border-[#eadfce]
                    bg-[#f8f4ec]
                  "
                >
                  <Link
                    href={`/animal/${like.animal_id}`}
                    className="block"
                  >
                    <div
                      className="
                        aspect-[4/3]
                        overflow-hidden
                        bg-[#eadfce]
                      "
                    >
                      {photoUrl ? (
                        <img
                          src={
                            photoUrl
                          }
                          alt={
                            animal
                              ?.animal_name ||
                            "Animal"
                          }
                          className="
                            h-full
                            w-full
                            object-cover
                            transition
                            hover:scale-[1.03]
                          "
                        />
                      ) : (
                        <div
                          className="
                            flex
                            h-full
                            items-center
                            justify-center
                            text-5xl
                          "
                        >
                          🐾
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    <h3 className="text-lg font-black text-[#2f241c]">
                      {animal
                        ?.animal_name ||
                        "Animal"}
                    </h3>

                    <p className="mt-1 text-sm text-[#6f5a47]">
                      {animal
                        ?.animal_type ||
                        "Animal"}
                      {animal
                        ?.age_label
                        ? ` · ${animal.age_label}`
                        : ""}
                    </p>

                    <p className="mt-1 text-sm text-[#6f5a47]">
                      📍{" "}
                      {[
                        animal?.city,
                        animal?.island,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " · "
                        ) ||
                        "Localisation non renseignée"}
                    </p>

                    <Link
                      href={`/animal/${like.animal_id}`}
                      className="
                        mt-4
                        inline-flex
                        rounded-full
                        bg-[#064b42]
                        px-5
                        py-2.5
                        text-sm
                        font-bold
                        text-white
                      "
                    >
                      Voir le profil
                    </Link>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}