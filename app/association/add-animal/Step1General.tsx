export default function Step1General({ animal, updateField }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black">Informations générales</h2>

      <div className="grid gap-5 md:grid-cols-2">
        <input className="input" placeholder="Nom" value={animal.animal_name} onChange={(e) => updateField("animal_name", e.target.value)} />
        <input className="input" placeholder="Espèce" value={animal.animal_type} onChange={(e) => updateField("animal_type", e.target.value)} />
        <input className="input" placeholder="Race" value={animal.breed} onChange={(e) => updateField("breed", e.target.value)} />

        <select className="input" value={animal.sex} onChange={(e) => updateField("sex", e.target.value)}>
          <option>Femelle</option>
          <option>Mâle</option>
          <option>Inconnu</option>
        </select>

        <input className="input" placeholder="Âge estimé" value={animal.age_label} onChange={(e) => updateField("age_label", e.target.value)} />
        <input className="input" placeholder="Taille" value={animal.size_label} onChange={(e) => updateField("size_label", e.target.value)} />
        <input className="input" placeholder="Poids en kg" value={animal.weight_kg} onChange={(e) => updateField("weight_kg", e.target.value)} />
      </div>
    </div>
  );
}