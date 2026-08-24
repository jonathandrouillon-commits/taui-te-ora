export type MatchDetails = {
  logement: number;
  famille: number;
  animaux: number;
  activite: number;
  experience: number;

  strengths: string[];
  warnings: string[];
  blockers: string[];
};

export type MatchResult = {
  score: number;
  level: string;
  details: MatchDetails;
};

function normalize(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(
  value: unknown,
  candidates: string[]
) {
  const normalized = normalize(value);

  return candidates.some((candidate) =>
    normalized.includes(
      normalize(candidate)
    )
  );
}

function clampScore(score: number) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
  );
}

export function calculateCompatibility(
  questionnaire: any,
  animal: any
): MatchResult {
  const strengths: string[] = [];
  const warnings: string[] = [];
  const blockers: string[] = [];

  /* =========================================================
     1. LOGEMENT
     Poids : 25 %
  ========================================================= */

  let logement = 70;

  const adopterGarden =
    questionnaire?.jardin ||
    questionnaire?.type_logement ||
    "";

  const requirement =
    animal?.garden_requirement ||
    "";

  if (
    includesAny(
      requirement,
      ["indispensable", "obligatoire"]
    )
  ) {
    if (
      includesAny(
        adopterGarden,
        ["cloture", "clôturé"]
      )
    ) {
      logement = 100;

      strengths.push(
        "Le logement répond au besoin de jardin clôturé."
      );
    } else {
      logement = 20;

      blockers.push(
        "Un jardin clôturé est indispensable pour cet animal."
      );
    }
  } else if (
    includesAny(
      requirement,
      ["recommande", "recommandé"]
    )
  ) {
    if (
      includesAny(
        adopterGarden,
        [
          "cloture",
          "clôturé",
          "ouvert",
          "jardin",
          "terrain",
        ]
      )
    ) {
      logement = 95;

      strengths.push(
        "L'environnement extérieur semble adapté."
      );
    } else {
      logement = 55;

      warnings.push(
        "Un jardin est recommandé pour cet animal."
      );
    }
  } else {
    logement = 85;

    strengths.push(
      "Le logement ne présente pas de contrainte majeure connue."
    );
  }

  /* =========================================================
     2. FAMILLE / ENFANTS
     Poids : 20 %
  ========================================================= */

  let famille = 85;

  const children =
    questionnaire?.enfants ||
    "";

  const hasYoungChildren =
    includesAny(
      children,
      [
        "moins de 8",
        "moins de 6",
      ]
    );

  const hasMidChildren =
    includesAny(
      children,
      [
        "plus de 8",
        "8 à 14",
        "8-14",
        "6 à 12",
      ]
    );

  const hasOlderChildren =
    includesAny(
      children,
      [
        "plus de 15",
        "15 ans",
        "plus de 12",
      ]
    );

  if (
    hasYoungChildren &&
    includesAny(
      animal?.enfants_moins_8,
      ["incompatible"]
    )
  ) {
    famille = 15;

    blockers.push(
      "Cet animal n'est pas compatible avec les jeunes enfants."
    );
  } else if (
    hasYoungChildren &&
    includesAny(
      animal?.enfants_moins_8,
      ["a eviter", "à éviter"]
    )
  ) {
    famille = 45;

    warnings.push(
      "La cohabitation avec de jeunes enfants est à évaluer."
    );
  } else if (
    hasMidChildren &&
    includesAny(
      animal?.enfants_8_14,
      ["incompatible"]
    )
  ) {
    famille = 20;

    blockers.push(
      "Cet animal n'est pas compatible avec les enfants de ce foyer."
    );
  } else if (
    hasOlderChildren &&
    includesAny(
      animal?.enfants_15_plus,
      ["incompatible"]
    )
  ) {
    famille = 30;

    blockers.push(
      "La compatibilité avec les adolescents doit être revue."
    );
  } else {
    famille = 95;

    strengths.push(
      "La composition familiale semble compatible."
    );
  }

  /* =========================================================
     3. AUTRES ANIMAUX
     Poids : 20 %
  ========================================================= */

  let animaux = 85;

  const currentAnimals =
    questionnaire?.animal_actuel ||
    questionnaire?.current_animals ||
    "";

  const hasDog =
    includesAny(
      currentAnimals,
      ["chien"]
    );

  const hasCat =
    includesAny(
      currentAnimals,
      ["chat"]
    );

  if (
    hasDog &&
    includesAny(
      animal?.foyer_chiens,
      ["incompatible"]
    )
  ) {
    animaux = 15;

    blockers.push(
      "Cet animal n'est pas compatible avec les chiens déjà présents."
    );
  } else if (
    hasCat &&
    includesAny(
      animal?.foyer_chats,
      ["incompatible"]
    )
  ) {
    animaux = 15;

    blockers.push(
      "Cet animal n'est pas compatible avec les chats déjà présents."
    );
  } else if (
    hasDog &&
    includesAny(
      animal?.foyer_chiens,
      ["a tester", "à tester"]
    )
  ) {
    animaux = 60;

    warnings.push(
      "Une rencontre avec les chiens du foyer est recommandée."
    );
  } else if (
    hasCat &&
    includesAny(
      animal?.foyer_chats,
      ["a tester", "à tester"]
    )
  ) {
    animaux = 60;

    warnings.push(
      "La compatibilité avec les chats doit être testée."
    );
  } else {
    animaux = 95;

    strengths.push(
      "La cohabitation avec les animaux du foyer semble compatible."
    );
  }

  /* =========================================================
     4. ACTIVITE
     Poids : 20 %
  ========================================================= */

  let activite = 75;

  const wantedActivity =
    questionnaire?.activite_souhaitee ||
    questionnaire?.rythme_vie ||
    "";

  const animalActivity =
    animal?.activity_level ||
    "";

  const activityRank = (
    value: unknown
  ) => {
    if (
      includesAny(
        value,
        ["tres calme", "compagnie"]
      )
    ) {
      return 1;
    }

    if (
      includesAny(
        value,
        ["cool", "balades tranquilles", "calme"]
      )
    ) {
      return 2;
    }

    if (
      includesAny(
        value,
        ["tres actif", "très actif", "sportif"]
      )
    ) {
      return 4;
    }

    if (
      includesAny(
        value,
        ["actif", "active"]
      )
    ) {
      return 3;
    }

    return 0;
  };

  const adopterRank =
    activityRank(wantedActivity);

  const animalRank =
    activityRank(animalActivity);

  if (
    adopterRank > 0 &&
    animalRank > 0
  ) {
    const difference =
      Math.abs(
        adopterRank -
          animalRank
      );

    if (difference === 0) {
      activite = 100;

      strengths.push(
        "Le niveau d'activité recherché correspond parfaitement."
      );
    } else if (difference === 1) {
      activite = 80;

      strengths.push(
        "Les niveaux d'activité sont proches."
      );
    } else if (difference === 2) {
      activite = 50;

      warnings.push(
        "Le niveau d'activité souhaité diffère de celui de l'animal."
      );
    } else {
      activite = 25;

      warnings.push(
        "Le rythme de vie semble très différent des besoins de l'animal."
      );
    }
  }

  /* =========================================================
     5. EXPERIENCE / BESOINS SPECIAUX
     Poids : 15 %
  ========================================================= */

  let experience = 85;

  const ownerExperience =
    questionnaire?.proprietaire_animal ||
    questionnaire?.adopter_experience ||
    "";

  const acceptsSpecialNeeds =
    questionnaire?.besoins_speciaux ||
    "";

  const needsExperience =
    includesAny(
      animal?.experience_recommandee,
      [
        "experimente",
        "expérimenté",
      ]
    );

  const specialNeed =
    Boolean(
      animal?.handicap ||
        animal?.traitement_regulier ||
        animal?.craintif_traumatise ||
        animal?.education_a_poursuivre
    );

  if (needsExperience) {
    if (
      includesAny(
        ownerExperience,
        [
          "oui",
          "avant",
          "experimente",
          "expérimenté",
        ]
      )
    ) {
      experience = 95;

      strengths.push(
        "L'expérience de l'adoptant correspond aux besoins de l'animal."
      );
    } else {
      experience = 45;

      warnings.push(
        "Un adoptant expérimenté est recommandé pour cet animal."
      );
    }
  }

  if (specialNeed) {
    if (
      includesAny(
        acceptsSpecialNeeds,
        ["oui", "pas de preference"]
      )
    ) {
      experience = Math.max(
        experience,
        85
      );

      strengths.push(
        "L'adoptant est ouvert aux besoins spécifiques de l'animal."
      );
    } else if (
      includesAny(
        acceptsSpecialNeeds,
        ["non"]
      )
    ) {
      experience = 20;

      blockers.push(
        "L'animal a des besoins spécifiques que l'adoptant ne souhaite pas prendre en charge."
      );
    }
  }

  /* =========================================================
     SCORE GLOBAL
  ========================================================= */

  let score =
    logement * 0.25 +
    famille * 0.2 +
    animaux * 0.2 +
    activite * 0.2 +
    experience * 0.15;

  /*
   * Une incompatibilité majeure ne doit
   * jamais être masquée par un bon score
   * sur les autres critères.
   */

  if (
    blockers.length >= 2
  ) {
    score = Math.min(
      score,
      45
    );
  } else if (
    blockers.length === 1
  ) {
    score = Math.min(
      score,
      59
    );
  }

  score =
    clampScore(score);

  let level =
    "Plusieurs points à vérifier";

  if (
    blockers.length === 0 &&
    score >= 90
  ) {
    level =
      "Excellent match";
  } else if (
    blockers.length === 0 &&
    score >= 75
  ) {
    level =
      "Très bon match";
  } else if (
    blockers.length === 0 &&
    score >= 60
  ) {
    level =
      "Match possible";
  }

  return {
    score,
    level,

    details: {
      logement:
        clampScore(logement),

      famille:
        clampScore(famille),

      animaux:
        clampScore(animaux),

      activite:
        clampScore(activite),

      experience:
        clampScore(experience),

      strengths,
      warnings,
      blockers,
    },
  };
}

export const compatibilityService = {
  calculate:
    calculateCompatibility,
};