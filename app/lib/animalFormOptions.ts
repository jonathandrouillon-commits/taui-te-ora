export const ANIMAL_TYPES = [
  "Chien",
  "Chat",
  "Cheval",
  "Oiseau",
  "Lapin",
  "Autres",
] as const;

export const ANIMAL_SEXES = [
  "Femelle",
  "Mâle",
  "Inconnu",
] as const;

export const ANIMAL_AGES = [
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
  "Inconnu",
] as const;

export const ANIMAL_SIZES = [
  "Petit",
  "Moyen",
  "Grand",
  "Hors catégorie",
  "Inconnu",
] as const;

export const ANIMAL_WEIGHTS = [
  ...Array.from(
    { length: 81 },
    (_, index) => String(index)
  ),
  "Inconnu",
] as const;

export const COMPATIBILITY_OPTIONS = [
  "Oui",
  "Non",
  "À tester",
  "Inconnu",
] as const;

export const HEALTH_STATUS_OPTIONS = [
  "Très bonne",
  "Bonne",
  "Moyenne",
  "Fragile",
  "Mauvaise",
  "Inconnue",
] as const;

export const ISLAND_COMMUNES: Record<string, string[]> = {
  Tahiti: [
    "Arue",
    "Faa'a",
    "Hitia'a O Te Ra",
    "Mahina",
    "Paea",
    "Papara",
    "Papeete",
    "Pirae",
    "Punaauia",
    "Taiarapu-Est",
    "Taiarapu-Ouest",
    "Teva I Uta",
  ],
  Moorea: ["Moorea-Maiao"],
  Maiao: ["Moorea-Maiao"],
  "Bora Bora": ["Bora-Bora"],
  Raiatea: [
    "Taputapuatea",
    "Tumaraa",
    "Uturoa",
  ],
  Tahaa: ["Taha'a"],
  Huahine: ["Huahine"],
  Maupiti: ["Maupiti"],
  Tupai: ["Bora-Bora"],
  Rangiroa: ["Rangiroa"],
  Tikehau: ["Rangiroa"],
  Mataiva: ["Rangiroa"],
  Makatea: ["Rangiroa"],
  Fakarava: ["Fakarava"],
  Toau: ["Fakarava"],
  Niau: ["Fakarava"],
  Aratika: ["Fakarava"],
  Kauehi: ["Fakarava"],
  Raraka: ["Fakarava"],
  Taiaro: ["Fakarava"],
  Anaa: ["Anaa"],
  Faaite: ["Anaa"],
  Motutunga: ["Anaa"],
  Takume: ["Makemo"],
  Makemo: ["Makemo"],
  Katiu: ["Makemo"],
  Nihiru: ["Makemo"],
  "Marutea Nord": ["Makemo"],
  Raroia: ["Makemo"],
  Taenga: ["Makemo"],
  Takapoto: ["Takaroa"],
  Takaroa: ["Takaroa"],
  Tikei: ["Takaroa"],
  Manihi: ["Manihi"],
  Ahe: ["Manihi"],
  Arutua: ["Arutua"],
  Apataki: ["Arutua"],
  Kaukura: ["Arutua"],
  Hao: ["Hao"],
  Amanu: ["Hao"],
  Hereheretue: ["Hao"],
  Nukutavake: ["Nukutavake"],
  Reao: ["Reao"],
  Pukarua: ["Reao"],
  Tatakoto: ["Tatakoto"],
  Tureia: ["Tureia"],
  Mururoa: ["Tureia"],
  Fangataufa: ["Tureia"],
  Gambier: ["Gambier"],
  Mangareva: ["Gambier"],
  Rurutu: ["Rurutu"],
  Tubuai: ["Tubuai"],
  Raivavae: ["Raivavae"],
  Rimatara: ["Rimatara"],
  Rapa: ["Rapa"],
  "Nuku Hiva": ["Nuku-Hiva"],
  "Hiva Oa": ["Hiva-Oa"],
  "Ua Pou": ["Ua-Pou"],
  "Ua Huka": ["Ua-Huka"],
  Tahuata: ["Tahuata"],
  "Fatu Hiva": ["Fatu-Hiva"],
};

export const POLYNESIA_ISLANDS =
  Object.keys(
    ISLAND_COMMUNES
  ).sort((a, b) =>
    a.localeCompare(
      b,
      "fr"
    )
  );

export function getCommunesForIsland(
  island: string
) {
  return ISLAND_COMMUNES[
    island
  ] || [];
}
