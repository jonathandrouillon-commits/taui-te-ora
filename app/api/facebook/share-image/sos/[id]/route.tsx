import {
  ImageResponse,
} from "next/og";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

type AnyRow = Record<
  string,
  unknown
>;

function getSupabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error(
      "Configuration Supabase serveur manquante."
    );
  }

  return createClient(
    url,
    serviceRole,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function clean(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function firstValue(
  row: AnyRow | null,
  keys: string[]
) {
  if (!row) {
    return "";
  }

  for (const key of keys) {
    const value =
      clean(row[key]);

    if (value) {
      return value;
    }
  }

  return "";
}

function helpLabel(
  value: string
) {
  const labels:
    Record<string, string> = {
      famille_accueil:
        "🏠 Famille d’accueil",
      transport:
        "🚗 Transport",
      capture:
        "🛟 Capture / sauvetage",
      nourriture_materiel:
        "🥣 Nourriture / matériel",
      veterinaire:
        "🩺 Accompagnement vétérinaire",
      benevolat:
        "🤝 Bénévolat",
    };

  return (
    labels[value] ||
    "🤝 Aide"
  );
}

function urgencyLabel(
  value: string
) {
  if (value === "critique") {
    return "🚨 CRITIQUE";
  }

  if (value === "urgente") {
    return "⚠️ URGENTE";
  }

  return "ℹ️ NORMALE";
}

async function tryLoadRow(
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >,
  tableName: string,
  id: string
): Promise<AnyRow | null> {
  try {
    const {
      data,
      error,
    } =
      await supabase
        .from(tableName)
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (
      error ||
      !data
    ) {
      return null;
    }

    return data as AnyRow;
  } catch {
    return null;
  }
}

async function getBestImage({
  supabase,
  sos,
}: {
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >;
  sos: AnyRow;
}) {
  /*
   * PRIORITE IMAGE FACEBOOK SOS
   *
   * 1. Photo enregistrée directement sur le SOS
   * 2. Photo du compagnon Taui Te Ora lié
   * 3. Photo de couverture de l'animal en adoption lié
   * 4. Photo / avatar / logo du profil qui demande l'aide
   * 5. Aucune image : le visuel garde simplement le design Taui Te Ora
   */

  const directPhoto =
    firstValue(
      sos,
      [
        "photo_url",
      ]
    );

  if (directPhoto) {
    return {
      imageUrl:
        directPhoto,
      source:
        "animal",
    };
  }

  const companionId =
    firstValue(
      sos,
      [
        "companion_id",
      ]
    );

  if (companionId) {
    const companion =
      await tryLoadRow(
        supabase,
        "companions",
        companionId
      );

    const companionPhoto =
      firstValue(
        companion,
        [
          "photo_url",
          "avatar_url",
          "image_url",
          "profile_image_url",
        ]
      );

    if (companionPhoto) {
      return {
        imageUrl:
          companionPhoto,
        source:
          "animal",
      };
    }
  }

  const adoptionAnimalId =
    firstValue(
      sos,
      [
        "adoption_animal_id",
        "animal_id",
      ]
    );

  if (adoptionAnimalId) {
    try {
      const {
        data: photos,
      } =
        await supabase
          .from("animal_photos")
          .select(
            "photo_url,is_cover,sort_order"
          )
          .eq(
            "animal_id",
            adoptionAnimalId
          )
          .order(
            "is_cover",
            {
              ascending:
                false,
            }
          )
          .order(
            "sort_order",
            {
              ascending:
                true,
            }
          );

      const photoRows =
        (photos || []) as Array<{
          photo_url:
            string | null;
          is_cover:
            boolean | null;
          sort_order:
            number | null;
        }>;

      const animalPhoto =
        photoRows.find(
          (photo) =>
            Boolean(
              photo.is_cover &&
              photo.photo_url
            )
        )?.photo_url ||
        photoRows.find(
          (photo) =>
            Boolean(
              photo.photo_url
            )
        )?.photo_url ||
        null;

      if (animalPhoto) {
        return {
          imageUrl:
            animalPhoto,
          source:
            "animal",
        };
      }
    } catch {
      // On continue vers le profil demandeur.
    }

    const animal =
      await tryLoadRow(
        supabase,
        "animals",
        adoptionAnimalId
      );

    const animalPhoto =
      firstValue(
        animal,
        [
          "photo_url",
          "image_url",
        ]
      );

    if (animalPhoto) {
      return {
        imageUrl:
          animalPhoto,
        source:
          "animal",
      };
    }
  }

  const createdBy =
    firstValue(
      sos,
      [
        "created_by",
      ]
    );

  if (createdBy) {
    const profile =
      await tryLoadRow(
        supabase,
        "profiles",
        createdBy
      );

    const profilePhoto =
      firstValue(
        profile,
        [
          "avatar_url",
          "photo_url",
          "logo_url",
          "profile_image_url",
          "image_url",
          "logo",
        ]
      );

    if (profilePhoto) {
      return {
        imageUrl:
          profilePhoto,
        source:
          "profile",
      };
    }
  }

  return {
    imageUrl:
      "",
    source:
      "none",
  };
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const {
      id,
    } =
      await context.params;

    const supabase =
      getSupabaseAdmin();

    const {
      data,
      error,
    } =
      await supabase
        .from("help_sos")
        .select(
          `
            id,
            title,
            help_type,
            island,
            city,
            message,
            urgency,
            status,
            animal_type,
            animals_count,
            created_at,
            created_by,
            photo_url,
            companion_id,
            adoption_animal_id,
            animal_id
          `
        )
        .eq(
          "id",
          id
        )
        .maybeSingle();

    if (
      error ||
      !data
    ) {
      return new Response(
        "SOS introuvable.",
        {
          status:
            404,
        }
      );
    }

    const sos =
      data as AnyRow;

    const {
      imageUrl,
      source,
    } =
      await getBestImage({
        supabase,
        sos,
      });

    const tauiLogoUrl =
      process.env.TAUI_LOGO_URL ||
      "https://www.taui-te-ora.com/logo-taui-te-ora.png";

    const location =
      [
        clean(
          sos.city
        ),
        clean(
          sos.island
        ),
      ]
        .filter(Boolean)
        .join(" · ");

    const title =
      clean(
        sos.title
      );

    const message =
      clean(
        sos.message
      );

    const urgency =
      clean(
        sos.urgency
      );

    const helpType =
      clean(
        sos.help_type
      );

    return new ImageResponse(
      (
        <div
          style={{
            width:
              "1200px",
            height:
              "1200px",
            display:
              "flex",
            flexDirection:
              "column",
            background:
              "#fffaf4",
            fontFamily:
              "Arial, Helvetica, sans-serif",
            color:
              "#064b42",
            overflow:
              "hidden",
          }}
        >
          {/* PHOTO PRINCIPALE */}
          {imageUrl ? (
            <div
              style={{
                width:
                  "1200px",
                height:
                  "610px",
                display:
                  "flex",
                position:
                  "relative",
                background:
                  "#efe8df",
              }}
            >
              <img
                src={
                  imageUrl
                }
                alt={
                  source ===
                  "profile"
                    ? "Profil demandeur"
                    : "Animal concerné"
                }
                width="1200"
                height="610"
                style={{
                  width:
                    "1200px",
                  height:
                    "610px",
                  objectFit:
                    "cover",
                }}
              />

              <div
                style={{
                  position:
                    "absolute",
                  left:
                    "44px",
                  top:
                    "42px",
                  display:
                    "flex",
                  padding:
                    "14px 22px",
                  borderRadius:
                    "999px",
                  background:
                    "rgba(255,255,255,0.92)",
                  fontSize:
                    "24px",
                  fontWeight:
                    900,
                  color:
                    "#c64848",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.12)",
                }}
              >
                🚨 SOS RÉSEAU D’AIDE
              </div>

              <div
                style={{
                  position:
                    "absolute",
                  right:
                    "38px",
                  top:
                    "34px",
                  display:
                    "flex",
                  width:
                    "155px",
                  height:
                    "95px",
                  padding:
                    "10px",
                  borderRadius:
                    "24px",
                  background:
                    "rgba(255,255,255,0.92)",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <img
                  src={
                    tauiLogoUrl
                  }
                  alt="Taui Te Ora"
                  width="135"
                  height="75"
                  style={{
                    width:
                      "135px",
                    height:
                      "75px",
                    objectFit:
                      "contain",
                  }}
                />
              </div>

              {source ===
              "profile" ? (
                <div
                  style={{
                    position:
                      "absolute",
                    left:
                      "44px",
                    bottom:
                      "34px",
                    display:
                      "flex",
                    padding:
                      "11px 18px",
                    borderRadius:
                      "999px",
                    background:
                      "rgba(6,75,66,0.92)",
                    color:
                      "white",
                    fontSize:
                      "20px",
                    fontWeight:
                      800,
                  }}
                >
                  Profil de la personne qui demande de l’aide
                </div>
              ) : null}
            </div>
          ) : (
            <div
              style={{
                width:
                  "1200px",
                height:
                  "330px",
                display:
                  "flex",
                padding:
                  "58px 68px",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                background:
                  "linear-gradient(135deg, #fff1f2 0%, #fffaf4 100%)",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    fontSize:
                      "38px",
                    fontWeight:
                      900,
                    color:
                      "#c64848",
                  }}
                >
                  🚨 SOS RÉSEAU D’AIDE
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    marginTop:
                      "14px",
                    fontSize:
                      "26px",
                    color:
                      "#756d67",
                  }}
                >
                  TAUI TE ORA
                </div>
              </div>

              <img
                src={
                  tauiLogoUrl
                }
                alt="Taui Te Ora"
                width="210"
                height="130"
                style={{
                  width:
                    "210px",
                  height:
                    "130px",
                  objectFit:
                    "contain",
                }}
              />
            </div>
          )}

          {/* INFORMATIONS */}
          <div
            style={{
              flex:
                1,
              display:
                "flex",
              flexDirection:
                "column",
              padding:
                imageUrl
                  ? "46px 62px 54px"
                  : "38px 70px 58px",
              justifyContent:
                "space-between",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignSelf:
                    "flex-start",
                  borderRadius:
                    "999px",
                  backgroundColor:
                    urgency ===
                    "critique"
                      ? "#fee2e2"
                      : urgency ===
                        "urgente"
                      ? "#fef3c7"
                      : "#e7f3ef",
                  color:
                    urgency ===
                    "critique"
                      ? "#b91c1c"
                      : urgency ===
                        "urgente"
                      ? "#92400e"
                      : "#064b42",
                  padding:
                    "12px 20px",
                  fontSize:
                    "22px",
                  fontWeight:
                    900,
                }}
              >
                {urgencyLabel(
                  urgency
                )}
              </div>

              <div
                style={{
                  display:
                    "flex",
                  marginTop:
                    "20px",
                  fontSize:
                    imageUrl
                      ? "52px"
                      : "66px",
                  lineHeight:
                    1.05,
                  fontWeight:
                    900,
                  letterSpacing:
                    "-1px",
                  color:
                    "#2f241c",
                }}
              >
                {title}
              </div>

              <div
                style={{
                  display:
                    "flex",
                  marginTop:
                    "24px",
                  flexDirection:
                    "column",
                  gap:
                    "12px",
                  fontSize:
                    imageUrl
                      ? "25px"
                      : "30px",
                  fontWeight:
                    700,
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                  }}
                >
                  {helpLabel(
                    helpType
                  )}
                </div>

                {location ? (
                  <div
                    style={{
                      display:
                        "flex",
                    }}
                  >
                    📍 {location}
                  </div>
                ) : null}
              </div>
            </div>

            <div
              style={{
                display:
                  "flex",
                backgroundColor:
                  "#ffffff",
                borderRadius:
                  "24px",
                padding:
                  "22px 26px",
                boxShadow:
                  "0 10px 30px rgba(6,75,66,0.08)",
                flexDirection:
                  "column",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  fontSize:
                    "17px",
                  color:
                    "#9c7b54",
                  fontWeight:
                    800,
                  textTransform:
                    "uppercase",
                }}
              >
                Besoin
              </div>

              <div
                style={{
                  display:
                    "flex",
                  marginTop:
                    "7px",
                  fontSize:
                    imageUrl
                      ? "21px"
                      : "25px",
                  lineHeight:
                    1.3,
                  fontWeight:
                    700,
                  color:
                    "#5f554d",
                }}
              >
                {message.slice(
                  0,
                  imageUrl
                    ? 165
                    : 220
                )}
                {message.length >
                (
                  imageUrl
                    ? 165
                    : 220
                )
                  ? "…"
                  : ""}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width:
          1200,
        height:
          1200,
        headers: {
          "Cache-Control":
            "public, max-age=60, s-maxage=60",
        },
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Erreur image partage SOS :",
      error
    );

    return new Response(
      "Erreur génération image.",
      {
        status:
          500,
      }
    );
  }
}
