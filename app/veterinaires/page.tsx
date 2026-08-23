import TauiPageBackground from "../components/ui/TauiPageBackground";

const veterinaires = [
  {
    ile: "Tahiti",
    ville: "Papeete",
    nom: "Clinique vétérinaire",
    telephone: "À compléter",
    adresse: "Papeete, Tahiti",
  },
  {
    ile: "Tahiti",
    ville: "Punaauia",
    nom: "Cabinet vétérinaire",
    telephone: "À compléter",
    adresse: "Punaauia, Tahiti",
  },
  {
    ile: "Tahiti",
    ville: "Taravao",
    nom: "Cabinet vétérinaire",
    telephone: "À compléter",
    adresse: "Taravao, Tahiti",
  },
];

export default function VeterinairesPage() {
  return (
    <TauiPageBackground>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-4xl shadow-xl">
            🩺
          </div>

          <p className="mt-5 text-sm font-black uppercase tracking-[0.3em] text-[#b58b5b]">
            Annuaire
          </p>

          <h1 className="mt-2 text-4xl font-black text-[#064b42] md:text-6xl">
            Vétérinaires
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-gray-700">
            Retrouvez les coordonnées des vétérinaires disponibles en Polynésie
            française.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {veterinaires.map((veterinaire, index) => (
            <article
              key={`${veterinaire.nom}-${index}`}
              className="rounded-[28px] border border-white/80 bg-white/85 p-6 shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-[#e8f4f1] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#064b42]">
                    {veterinaire.ile}
                  </span>

                  <h2 className="mt-4 text-xl font-black text-[#064b42]">
                    {veterinaire.nom}
                  </h2>
                </div>

                <span className="text-3xl">🐾</span>
              </div>

              <div className="mt-5 space-y-3 text-sm text-gray-700">
                <p>
                  <span className="font-black">Ville :</span>{" "}
                  {veterinaire.ville}
                </p>

                <p>
                  <span className="font-black">Adresse :</span>{" "}
                  {veterinaire.adresse}
                </p>

                <p>
                  <span className="font-black">Téléphone :</span>{" "}
                  {veterinaire.telephone}
                </p>
              </div>

              {veterinaire.telephone !== "À compléter" && (
                <a
                  href={`tel:${veterinaire.telephone.replace(/\s/g, "")}`}
                  className="mt-6 block rounded-full bg-[#064b42] px-5 py-3 text-center font-black text-white transition hover:bg-[#08695d]"
                >
                  Appeler
                </a>
              )}
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[28px] border border-[#e8d9c3] bg-[#fffaf1]/90 p-6 text-center shadow-lg backdrop-blur-md">
          <p className="font-bold text-[#6f5b40]">
            En cas d’urgence vitale, contactez directement le vétérinaire le
            plus proche.
          </p>
        </div>
      </section>
    </TauiPageBackground>
  );
}