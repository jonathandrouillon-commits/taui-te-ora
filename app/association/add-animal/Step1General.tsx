const ages = [
  "Inférieur à 1 mois",
  "1 mois",
  "2 mois",
  "3 mois",
  "4 mois",
  "5 mois",
  "6 mois",
  "7 mois",
  "8 mois",
  "9 mois",
  "10 mois",
  "11 mois",
  "1 an",
  "2 ans",
  "3 ans",
  "4 ans",
  "5 ans",
  "6 ans",
  "7 ans",
  "8 ans",
  "9 ans",
  "10 ans",
  "11 ans",
  "12 ans",
  "13 ans",
  "14 ans",
  "15 ans",
  "16 ans",
  "17 ans",
  "18 ans",
  "19 ans",
  "20 ans",
  "Plus de 20 ans",
];

const weights = Array.from({ length: 81 }, (_, i) => `${i}`);

export default function Step1General({ animal, updateField }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black">Informations générales</h2>

      <div className="grid gap-5 md:grid-cols-2">

        <input
          className="input"
          placeholder="Nom de l'animal"
          value={animal.animal_name}
          onChange={(e) => updateField("animal_name", e.target.value)}
        />

        <select
          className="input"
          value={animal.animal_type}
          onChange={(e) => updateField("animal_type", e.target.value)}
        >
          <option value="">Catégorie de l'animal</option>
          <option>Chien</option>
          <option>Chat</option>
          <option>Cheval</option>
          <option>Oiseau</option>
          <option>Lapin</option>
          <option>Autres</option>
        </select>

        <input
          className="input"
          placeholder="Race"
          value={animal.breed}
          onChange={(e) => updateField("breed", e.target.value)}
        />

        <select
          className="input"
          value={animal.sex}
          onChange={(e) => updateField("sex", e.target.value)}
        >
          <option value="">Sexe</option>
          <option>Femelle</option>
          <option>Mâle</option>
          <option>Inconnu</option>
        </select>

        <select
          className="input"
          value={animal.age_label}
          onChange={(e) => updateField("age_label", e.target.value)}
        >
          <option value="">Âge de l'animal</option>

          {ages.map((age) => (
            <option key={age} value={age}>
              {age}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={animal.size_label}
          onChange={(e) => updateField("size_label", e.target.value)}
        >
          <option value="">Taille de l'animal</option>
          <option>Petit</option>
          <option>Moyen</option>
          <option>Grand</option>
          <option>Hors catégorie</option>
        </select>

        <select
          className="input"
          value={animal.weight_kg}
          onChange={(e) => updateField("weight_kg", e.target.value)}
        >
          <option value="">Poids en kg</option>

          {weights.map((weight) => (
            <option key={weight} value={weight}>
              {weight} kg
            </option>
          ))}
        </select>

      </div>
    </div>
  );
}