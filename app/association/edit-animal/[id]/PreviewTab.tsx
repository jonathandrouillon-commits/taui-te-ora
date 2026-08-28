"use client";

type PreviewAnimal = {
  id?: string;
  animal_name?: string | null;
  animal_type?: string | null;
  age_label?: string | null;
  sex?: string | null;
  breed?: string | null;
  size_label?: string | null;
  city?: string | null;
  island?: string | null;
  description_character?: string | null;
  health_status?: string | null;
  story?: string | null;
  status?: string | null;
  vaccinated?: boolean | null;
  sterilized?: boolean | null;
  microchipped?: boolean | null;
  is_published?: boolean | null;
  is_adopted?: boolean | null;
};

type PreviewPhoto = {
  id?: string;
  photo_url?: string | null;
  is_cover?: boolean | null;
  sort_order?: number | null;
};

type Props = {
  animal: PreviewAnimal;
  photos: PreviewPhoto[];
};

export default function PreviewTab({
  animal,
  photos,
}: Props) {
  const cover =
    photos.find((photo) => photo.is_cover)?.photo_url ||
    photos[0]?.photo_url ||
    "/placeholder-animal.png";

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-[#064b42]">
        Aperçu de la fiche
      </h2>

      <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
        <img
          src={cover}
          alt={animal.animal_name || "Animal"}
          className="h-96 w-full object-cover"
        />

        <div className="space-y-4 p-6">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#b68b2f]">
              {animal.animal_type || "Animal"}
            </p>

            <h3 className="text-4xl font-black text-[#064b42]">
              {animal.animal_name || "Sans nom"}
            </h3>
          </div>

          <p className="text-gray-600">
            {animal.breed || "Race non renseignée"} •{" "}
            {animal.sex || "Sexe non renseigné"} •{" "}
            {animal.age_label || "Âge non renseigné"}
          </p>

          <p className="text-gray-700">
            {animal.description_character ||
              "Aucune description du caractère pour le moment."}
          </p>

          <div className="flex flex-wrap gap-2">
            {animal.vaccinated && (
              <Badge label="Vacciné" />
            )}

            {animal.sterilized && (
              <Badge label="Stérilisé" />
            )}

            {animal.microchipped && (
              <Badge label="Identifié" />
            )}

            {animal.is_published ? (
              <Badge label="Publié" />
            ) : (
              <Badge label="Brouillon" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({
  label,
}: {
  label: string;
}) {
  return (
    <span className="rounded-full bg-[#f4eee3] px-4 py-2 text-sm font-black text-[#064b42]">
      {label}
    </span>
  );
}