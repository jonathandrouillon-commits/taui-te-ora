export default function Step7Preview({ animal, photos }: any) {
  const preview =
    photos.length > 0
      ? URL.createObjectURL(photos[0])
      : "https://placehold.co/600x600?text=Pas+de+photo";

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black">Prévisualisation</h2>

      <div className="overflow-hidden rounded-[32px] bg-[#f8f4ec] shadow">
        <img src={preview} className="h-96 w-full object-cover" alt="Aperçu" />

        <div className="p-8">
          <h3 className="text-5xl font-black text-[#064b42]">
            {animal.animal_name || "Nom de l'animal"}
          </h3>

          <p className="mt-2 text-xl text-gray-600">
            {animal.sex} • {animal.age_label || "Âge inconnu"} •{" "}
            {animal.size_label || "Taille inconnue"}
          </p>

          <p className="mt-6 text-lg">
            {animal.description_character || "Description non renseignée."}
          </p>
        </div>
      </div>
    </div>
  );
}