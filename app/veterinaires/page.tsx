const veterinaires = [
  {
    nom: "Clinique vétérinaire de Paofai",
    ville: "Papeete",
    adresse: "55 rue des Poilus Tahitiens, Paofai",
    telephone: "40 42 55 00",
    email: "Non renseigné",
  },
  {
    nom: "Veto Pamatai - Clinique vétérinaire de Pamatai",
    ville: "Papeete / Pamatai",
    adresse: "Pamatai",
    telephone: "40 83 20 20",
    email: "Non renseigné",
  },
  {
    nom: "Clinique Vétérinaire de Fariipiti",
    ville: "Pirae",
    adresse: "Avenue du chef Vairaatoa, Pirae",
    telephone: "40 50 65 65",
    email: "Non renseigné",
  },
  {
    nom: "Clinique Vétérinaire Hamuta",
    ville: "Pirae",
    adresse: "Hamuta, Pirae",
    telephone: "40 52 10 10",
    email: "Non renseigné",
  },
  {
    nom: "Clinique Vétérinaire de Mahina Fariipiti Iti",
    ville: "Mahina",
    adresse: "Mahina",
    telephone: "40 85 56 56",
    email: "Non renseigné",
  },
  {
    nom: "Vétérinaire de Arue",
    ville: "Arue",
    adresse: "Arue",
    telephone: "40 43 90 05",
    email: "Non renseigné",
  },
  {
    nom: "Clinique Vétérinaire d'Auae",
    ville: "Faa'a",
    adresse: "Auae, Faa'a",
    telephone: "40 58 45 45",
    email: "Non renseigné",
  },
  {
    nom: "Clinique vétérinaire de Faa'a",
    ville: "Faa'a",
    adresse: "Immeuble Air Tahiti, Faa'a",
    telephone: "40 82 91 63",
    email: "cliniquevetfaaa@yahoo.fr",
  },
  {
    nom: "Clinique Vétérinaire Maeva",
    ville: "Punaauia",
    adresse: "Punaauia",
    telephone: "40 42 41 12",
    email: "Non renseigné",
  },
  {
    nom: "Clinique Vétérinaire de Tamanu",
    ville: "Punaauia",
    adresse: "Tamanu, Punaauia",
    telephone: "40 58 45 14",
    email: "Non renseigné",
  },
  {
    nom: "Clinique Vétérinaire du Lotus",
    ville: "Punaauia",
    adresse: "Lotus, Punaauia",
    telephone: "89 43 10 20",
    email: "Non renseigné",
  },
  {
    nom: "Clinique Vétérinaire de Paea",
    ville: "Paea",
    adresse: "Paea",
    telephone: "40 58 47 58",
    email: "Non renseigné",
  },
  {
    nom: "Veterinary Practice Papara",
    ville: "Papara",
    adresse: "Papara",
    telephone: "40 57 61 34",
    email: "Non renseigné",
  },
  {
    nom: "Clinique Vétérinaire de Taravao",
    ville: "Taravao",
    adresse: "Taravao",
    telephone: "40 57 00 20",
    email: "Non renseigné",
  },
  {
    nom: "Clinique vétérinaire de Moorea",
    ville: "Moorea",
    adresse: "Moorea",
    telephone: "40 56 55 00",
    email: "Non renseigné",
  },
  {
    nom: "VALVET",
    ville: "Moorea / Temae",
    adresse: "Temae, Moorea",
    telephone: "89 66 89 34",
    email: "Non renseigné",
  },
  {
    nom: "Cabinet vétérinaire des Îles Sous-le-Vent",
    ville: "Raiatea / Uturoa",
    adresse: "Uturoa, Raiatea",
    telephone: "40 66 28 99",
    email: "Non renseigné",
  },
  {
    nom: "Cabinet Vétérinaire des Îles Sous-le-Vent",
    ville: "Tahaa",
    adresse: "Tahaa",
    telephone: "87 29 21 23",
    email: "Non renseigné",
  },
  {
    nom: "Clinique Vétérinaire de Bora Bora",
    ville: "Bora Bora / Vaitape",
    adresse: "Vaitape, Bora Bora",
    telephone: "40 67 51 37",
    email: "Non renseigné",
  },
];

export default function VeterinairesPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 pb-28 pt-8 text-[#064b42]">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[32px] bg-white p-8 text-center shadow-xl">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#b58b5b]">
            CONTACTS UTILES
          </p>

          <h1 className="mt-3 text-5xl font-black text-[#064b42]">
            🩺 Vétérinaires en Polynésie
          </h1>

          <p className="mt-6 text-lg leading-8 text-[#6f5a47]">
            Retrouvez les principaux contacts vétérinaires classés par ville.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {veterinaires.map((vet) => (
            <article
              key={`${vet.nom}-${vet.telephone}`}
              className="overflow-hidden rounded-[28px] bg-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
            >
              {/* Photo identique pour toutes les cartes */}
              <div className="flex h-56 items-center justify-center bg-white p-6">
                <img
                  src="/veterinairelogo.png"
                  alt={vet.nom}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-black text-[#064b42]">
                  {vet.nom}
                </h2>

                <div className="mt-4 space-y-3 text-[#6f5a47]">
                  <p>
                    <strong>📍 Ville :</strong> {vet.ville}
                  </p>

                  <p>
                    <strong>🏠 Adresse :</strong> {vet.adresse}
                  </p>

                  <p>
                    <strong>📞 Téléphone :</strong> {vet.telephone}
                  </p>

                  <p>
                    <strong>✉️ Email :</strong> {vet.email}
                  </p>
                </div>

                <a
                  href={`tel:+689${vet.telephone.replaceAll(" ", "")}`}
                  className="mt-6 block rounded-2xl bg-[#064b42] px-5 py-4 text-center font-black text-white transition hover:scale-[1.02]"
                >
                  📞 Appeler
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}