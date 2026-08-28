import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PHOTOS = 5;

type RequestBody = {
  sourceSignalementId?: string;
  candidateSignalementId?: string;
};

type PhotoComparison = {
  photo_score: number;
  confidence: "faible" | "moyenne" | "forte";
  same_animal_possible: boolean;
  best_pair: {
    source_index: number | null;
    candidate_index: number | null;
  };
  reasons: string[];
};

function normalizeType(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function clampScore(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(number)));
}

function extractJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  return JSON.parse(cleaned);
}

export async function POST(request: NextRequest) {
  try {
    /*
     * ==============================
     * VARIABLES SERVEUR
     * ==============================
     */

    const openAiKey = process.env.OPENAI_API_KEY;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!openAiKey) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY manquante.",
        },
        {
          status: 500,
        }
      );
    }

    if (!supabaseUrl) {
      return NextResponse.json(
        {
          error:
            "NEXT_PUBLIC_SUPABASE_URL manquante.",
        },
        {
          status: 500,
        }
      );
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY manquante.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Important :
     * OpenAI est créé DANS la route.
     *
     * Cela évite l'erreur rencontrée
     * pendant `next build`.
     */

    const openai = new OpenAI({
      apiKey: openAiKey,
    });

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    /*
     * ==============================
     * BODY
     * ==============================
     */

    let body: RequestBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Corps JSON invalide.",
        },
        {
          status: 400,
        }
      );
    }

    const sourceSignalementId =
      body.sourceSignalementId?.trim();

    const candidateSignalementId =
      body.candidateSignalementId?.trim();

    if (
      !sourceSignalementId ||
      !candidateSignalementId
    ) {
      return NextResponse.json(
        {
          error:
            "sourceSignalementId et candidateSignalementId sont obligatoires.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      sourceSignalementId ===
      candidateSignalementId
    ) {
      return NextResponse.json(
        {
          error:
            "Les deux signalements doivent être différents.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ==============================
     * RÉCUPÉRATION DES SIGNALEMENTS
     * ==============================
     */

    const {
      data: signalements,
      error: signalementsError,
    } = await supabase
      .from("signalements")
      .select(
        `
          id,
          type_signalement,
          animal_type,
          sex,
          color,
          breed,
          collar_color,
          distinctive_features,
          identification_number
        `
      )
      .in("id", [
        sourceSignalementId,
        candidateSignalementId,
      ]);

    if (signalementsError) {
      console.error(
        "Erreur récupération signalements:",
        signalementsError
      );

      return NextResponse.json(
        {
          error:
            "Impossible de récupérer les signalements.",
        },
        {
          status: 500,
        }
      );
    }

    const source = signalements?.find(
      (item) =>
        item.id === sourceSignalementId
    );

    const candidate = signalements?.find(
      (item) =>
        item.id === candidateSignalementId
    );

    if (!source || !candidate) {
      return NextResponse.json(
        {
          error:
            "Un des signalements est introuvable.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ==============================
     * VÉRIFICATION PERDU ↔ TROUVÉ
     * ==============================
     */

    const sourceType = normalizeType(
      source.type_signalement
    );

    const candidateType = normalizeType(
      candidate.type_signalement
    );

    const validPair =
      (sourceType === "animal perdu" &&
        candidateType === "animal trouvé") ||
      (sourceType === "animal trouvé" &&
        candidateType === "animal perdu");

    if (!validPair) {
      return NextResponse.json(
        {
          error:
            "La comparaison photo nécessite un animal perdu et un animal trouvé.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Même espèce obligatoire.
     */

    if (
      normalizeType(source.animal_type) !==
      normalizeType(candidate.animal_type)
    ) {
      return NextResponse.json(
        {
          error:
            "Les deux signalements ne concernent pas la même espèce.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ==============================
     * PHOTOS
     * ==============================
     */

    const {
      data: medias,
      error: mediasError,
    } = await supabase
      .from("signalement_medias")
      .select(
        `
          id,
          signalement_id,
          file_url
        `
      )
      .in("signalement_id", [
        sourceSignalementId,
        candidateSignalementId,
      ])
      .order("id", {
        ascending: true,
      });

    if (mediasError) {
      console.error(
        "Erreur récupération photos:",
        mediasError
      );

      return NextResponse.json(
        {
          error:
            "Impossible de récupérer les photos.",
        },
        {
          status: 500,
        }
      );
    }

    const sourcePhotos = (medias ?? [])
      .filter(
        (media) =>
          media.signalement_id ===
            sourceSignalementId &&
          typeof media.file_url === "string" &&
          media.file_url.startsWith("https://")
      )
      .slice(0, MAX_PHOTOS);

    const candidatePhotos = (medias ?? [])
      .filter(
        (media) =>
          media.signalement_id ===
            candidateSignalementId &&
          typeof media.file_url === "string" &&
          media.file_url.startsWith("https://")
      )
      .slice(0, MAX_PHOTOS);

    /*
     * Pas d'appel OpenAI inutile si
     * l'un des deux n'a aucune photo.
     */

    if (
      sourcePhotos.length === 0 ||
      candidatePhotos.length === 0
    ) {
      return NextResponse.json({
        analyzed: false,

        reason:
          "Photos insuffisantes pour effectuer une comparaison.",

        source_photo_count:
          sourcePhotos.length,

        candidate_photo_count:
          candidatePhotos.length,

        photo_score: null,
        confidence: null,
        same_animal_possible: null,

        best_pair: {
          source_index: null,
          candidate_index: null,
        },

        reasons: [],
      });
    }

    /*
     * ==============================
     * CONSTRUCTION DES IMAGES
     * ==============================
     *
     * Une seule requête OpenAI.
     *
     * Jusqu'à :
     * 5 photos source
     * +
     * 5 photos candidat
     */

    const content: any[] = [
      {
        type: "input_text",
        text:
          `GROUPE A — signalement ${sourceType}. ` +
          `Il contient ${sourcePhotos.length} photo(s).`,
      },
    ];

    sourcePhotos.forEach(
      (photo, index) => {
        content.push({
          type: "input_text",
          text: `Groupe A — photo ${index + 1}`,
        });

        content.push({
          type: "input_image",
          image_url: photo.file_url,
        });
      }
    );

    content.push({
      type: "input_text",
      text:
        `GROUPE B — signalement ${candidateType}. ` +
        `Il contient ${candidatePhotos.length} photo(s).`,
    });

    candidatePhotos.forEach(
      (photo, index) => {
        content.push({
          type: "input_text",
          text: `Groupe B — photo ${index + 1}`,
        });

        content.push({
          type: "input_image",
          image_url: photo.file_url,
        });
      }
    );

    /*
     * ==============================
     * ANALYSE OPENAI
     * ==============================
     */

    const response =
      await openai.responses.create({
        model: "gpt-5.6-luna",

        /*
         * Les photos d'animaux ne doivent
         * pas être conservées dans la
         * réponse OpenAI.
         */
        store: false,

        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: `
Tu es un système d'aide au rapprochement de signalements d'animaux perdus et trouvés.

Tu dois comparer deux groupes de photographies afin d'estimer s'ils pourraient représenter le même animal.

IMPORTANT :

- Il s'agit d'une aide à la décision.
- Tu ne dois jamais affirmer avec certitude qu'il s'agit du même animal.
- Une ressemblance visuelle n'est pas une identification certaine.
- Analyse uniquement les caractéristiques visibles de l'animal.
- Ignore autant que possible le décor, la personne qui tient l'animal, la qualité photographique et l'arrière-plan.
- Une différence de lumière, d'angle, de distance, de posture ou de longueur apparente du poil ne doit pas automatiquement être considérée comme une différence d'animal.

Compare notamment :

- espèce et morphologie générale ;
- taille et proportions ;
- forme de la tête ;
- museau ;
- oreilles ;
- yeux ;
- robe et couleurs ;
- répartition des couleurs ;
- taches et marques particulières ;
- pattes ;
- poitrine ;
- queue ;
- longueur et texture du poil ;
- collier visible ;
- cicatrices ou signes distinctifs visibles.

Le score photo doit être compris entre 0 et 100.

Interprétation indicative :

0-29 :
très peu compatible.

30-49 :
faible ressemblance.

50-69 :
ressemblance possible.

70-84 :
forte ressemblance.

85-100 :
très forte ressemblance visuelle.

Ne donne PAS 100 simplement parce que les animaux se ressemblent fortement.

Retourne UNIQUEMENT un JSON valide exactement sous cette forme :

{
  "photo_score": 0,
  "confidence": "faible",
  "same_animal_possible": false,
  "best_pair": {
    "source_index": 0,
    "candidate_index": 0
  },
  "reasons": [
    "raison 1",
    "raison 2"
  ]
}

confidence doit être uniquement :

"faible"
"moyenne"
"forte"

Les index commencent à 0.

best_pair doit correspondre à la paire de photos montrant la ressemblance visuelle la plus utile.

Maximum 5 raisons.

Aucun texte avant ou après le JSON.
                `.trim(),
              },
            ],
          },

          {
            role: "user",
            content,
          },
        ],
      });

    /*
     * ==============================
     * PARSING
     * ==============================
     */

    const rawText =
      response.output_text?.trim();

    if (!rawText) {
      return NextResponse.json(
        {
          error:
            "OpenAI n'a retourné aucun résultat exploitable.",
        },
        {
          status: 502,
        }
      );
    }

    let parsed: any;

    try {
      parsed = extractJson(rawText);
    } catch (parseError) {
      console.error(
        "Réponse OpenAI JSON invalide:",
        rawText
      );

      return NextResponse.json(
        {
          error:
            "La réponse d'analyse photo n'est pas valide.",
        },
        {
          status: 502,
        }
      );
    }

    /*
     * ==============================
     * NORMALISATION DU RÉSULTAT
     * ==============================
     */

    const photoScore =
      clampScore(parsed.photo_score);

    let confidence:
      | "faible"
      | "moyenne"
      | "forte";

    if (
      parsed.confidence === "faible" ||
      parsed.confidence === "moyenne" ||
      parsed.confidence === "forte"
    ) {
      confidence = parsed.confidence;
    } else if (photoScore >= 80) {
      confidence = "forte";
    } else if (photoScore >= 50) {
      confidence = "moyenne";
    } else {
      confidence = "faible";
    }

    const sourceIndexRaw =
      Number(
        parsed?.best_pair?.source_index
      );

    const candidateIndexRaw =
      Number(
        parsed?.best_pair
          ?.candidate_index
      );

    const sourceIndex =
      Number.isInteger(sourceIndexRaw) &&
      sourceIndexRaw >= 0 &&
      sourceIndexRaw <
        sourcePhotos.length
        ? sourceIndexRaw
        : null;

    const candidateIndex =
      Number.isInteger(
        candidateIndexRaw
      ) &&
      candidateIndexRaw >= 0 &&
      candidateIndexRaw <
        candidatePhotos.length
        ? candidateIndexRaw
        : null;

    const reasons = Array.isArray(
      parsed.reasons
    )
      ? parsed.reasons
          .filter(
            (reason: unknown) =>
              typeof reason === "string"
          )
          .map((reason: string) =>
            reason.trim()
          )
          .filter(Boolean)
          .slice(0, 5)
      : [];

    const result: PhotoComparison = {
      photo_score: photoScore,

      confidence,

      same_animal_possible:
        typeof parsed.same_animal_possible ===
        "boolean"
          ? parsed.same_animal_possible
          : photoScore >= 50,

      best_pair: {
        source_index: sourceIndex,
        candidate_index:
          candidateIndex,
      },

      reasons,
    };

    /*
     * ==============================
     * RÉPONSE
     * ==============================
     */

    return NextResponse.json({
      analyzed: true,

      source_signalement_id:
        sourceSignalementId,

      candidate_signalement_id:
        candidateSignalementId,

      source_photo_count:
        sourcePhotos.length,

      candidate_photo_count:
        candidatePhotos.length,

      ...result,
    });
  } catch (error) {
    console.error(
      "Erreur matching photo:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Erreur inconnue";

    return NextResponse.json(
      {
        error:
          "Impossible d'effectuer l'analyse photo.",
        details:
          process.env.NODE_ENV ===
          "development"
            ? message
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}