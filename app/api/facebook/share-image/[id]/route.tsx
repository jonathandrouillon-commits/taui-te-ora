import {
  ImageResponse,
} from "next/og";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

type AnyRow =
  Record<string, unknown>;

type AnimalRow = {
  id: string;
  animal_name?: string | null;
  association_name?: string | null;
  owner_id?: string | null;
  association_id?: string | null;
  refuge_id?: string | null;
};

type AnimalPhoto = {
  photo_url: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
};

type Responsible = {
  name: string;
  logoUrl: string;
};

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Configuration Supabase serveur manquante."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function cleanValue(
  value: unknown
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function firstValue(
  row: AnyRow | null,
  keys: string[]
) {
  if (!row) {
    return "";
  }

  for (
    const key
    of keys
  ) {
    const value =
      cleanValue(
        row[key]
      );

    if (value) {
      return value;
    }
  }

  return "";
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
        .eq(
          "id",
          id
        )
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

async function loadResponsible({
  supabase,
  animal,
}: {
  supabase: ReturnType<
    typeof getSupabaseAdmin
  >;
  animal: AnimalRow;
}): Promise<Responsible> {
  /*
   * Priorité :
   * association -> refuge -> owner/profile.
   *
   * On utilise select("*") afin de rester
   * compatible avec les noms de colonnes
   * déjà présents dans ton projet.
   */

  if (animal.association_id) {
    const association =
      await tryLoadRow(
        supabase,
        "associations",
        animal.association_id
      );

    if (association) {
      return {
        name:
          firstValue(
            association,
            [
              "name",
              "association_name",
              "display_name",
              "organization_name",
              "nom",
            ]
          ) ||
          cleanValue(
            animal.association_name
          ) ||
          "Association partenaire",

        logoUrl:
          firstValue(
            association,
            [
              "logo_url",
              "avatar_url",
              "photo_url",
              "profile_image_url",
              "image_url",
              "logo",
            ]
          ),
      };
    }
  }

  if (animal.refuge_id) {
    const refuge =
      await tryLoadRow(
        supabase,
        "refuges",
        animal.refuge_id
      );

    if (refuge) {
      return {
        name:
          firstValue(
            refuge,
            [
              "name",
              "refuge_name",
              "display_name",
              "organization_name",
              "nom",
            ]
          ) ||
          "Refuge partenaire",

        logoUrl:
          firstValue(
            refuge,
            [
              "logo_url",
              "avatar_url",
              "photo_url",
              "profile_image_url",
              "image_url",
              "logo",
            ]
          ),
      };
    }
  }

  if (animal.owner_id) {
    const profile =
      await tryLoadRow(
        supabase,
        "profiles",
        animal.owner_id
      );

    if (profile) {
      const firstName =
        firstValue(
          profile,
          [
            "first_name",
            "prenom",
          ]
        );

      const lastName =
        firstValue(
          profile,
          [
            "last_name",
            "nom",
          ]
        );

      const fullNameFromParts =
        [
          firstName,
          lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

      return {
        name:
          firstValue(
            profile,
            [
              "display_name",
              "full_name",
              "organization_name",
              "association_name",
              "name",
            ]
          ) ||
          fullNameFromParts ||
          cleanValue(
            animal.association_name
          ) ||
          "Profil Taui Te Ora",

        logoUrl:
          firstValue(
            profile,
            [
              "avatar_url",
              "logo_url",
              "photo_url",
              "profile_image_url",
              "image_url",
              "logo",
            ]
          ),
      };
    }
  }

  return {
    name:
      cleanValue(
        animal.association_name
      ) ||
      "Taui Te Ora",

    logoUrl: "",
  };
}

export async function GET(
  request: Request,
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

    const requestUrl =
      new URL(
        request.url
      );

    const mode =
      requestUrl.searchParams.get(
        "mode"
      ) === "adopted"
        ? "adopted"
        : "available";

    const supabase =
      getSupabaseAdmin();

    const {
      data: animal,
      error: animalError,
    } =
      await supabase
        .from("animals")
        .select(
          `
            id,
            animal_name,
            association_name,
            owner_id,
            association_id,
            refuge_id
          `
        )
        .eq(
          "id",
          id
        )
        .maybeSingle();

    if (
      animalError ||
      !animal
    ) {
      return new Response(
        "Animal introuvable.",
        {
          status: 404,
        }
      );
    }

    const {
      data: photos,
      error: photosError,
    } =
      await supabase
        .from(
          "animal_photos"
        )
        .select(
          "photo_url, is_cover, sort_order"
        )
        .eq(
          "animal_id",
          id
        )
        .order(
          "is_cover",
          {
            ascending: false,
          }
        )
        .order(
          "sort_order",
          {
            ascending: true,
          }
        );

    if (photosError) {
      console.error(
        "Erreur image partage Facebook :",
        photosError
      );
    }

    const photoRows =
      (photos ||
        []) as AnimalPhoto[];

    const photoUrl =
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
      "";

    if (!photoUrl) {
      return new Response(
        "Photo introuvable.",
        {
          status: 404,
        }
      );
    }

    const responsible =
      await loadResponsible({
        supabase,
        animal:
          animal as AnimalRow,
      });

    /*
     * Mets dans Vercel :
     *
     * TAUI_LOGO_URL=https://...
     *
     * Cette URL doit être celle du
     * VRAI logo officiel Taui Te Ora.
     */
    const tauiLogoUrl =
      cleanValue(
        process.env.TAUI_LOGO_URL
      );

    const animalName =
      cleanValue(
        animal.animal_name
      ) ||
      "Animal";

    const title =
      mode === "adopted"
        ? `${animalName} a trouvé sa famille !`
        : `${animalName} cherche sa famille !`;

    const subtitle =
      mode === "adopted"
        ? "Une famille de plus ❤️"
        : "Et si c'était vous ? ❤️";

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "1200px",
            position: "relative",
            display: "flex",
            overflow: "hidden",
            backgroundColor: "#111111",
            fontFamily:
              "Arial, Helvetica, sans-serif",
          }}
        >
          <img
            src={photoUrl}
            alt=""
            width="1200"
            height="1200"
            style={{
              position: "absolute",
              inset: 0,
              width: "1200px",
              height: "1200px",
              objectFit: "cover",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "520px",
              display: "flex",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.72) 48%, rgba(0,0,0,0) 100%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "68px",
              right: "68px",
              bottom: "290px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#ffffff",
                fontSize: "70px",
                lineHeight: 1.06,
                fontWeight: 800,
                letterSpacing:
                  "-1.5px",
                textShadow:
                  "0 3px 14px rgba(0,0,0,0.75)",
              }}
            >
              {title}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: "16px",
                color:
                  "rgba(255,255,255,0.94)",
                fontSize: "34px",
                fontWeight: 500,
              }}
            >
              {subtitle}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "65px",
              bottom: "58px",
              display: "flex",
              alignItems: "center",
              maxWidth: "720px",
            }}
          >
            {responsible.logoUrl ? (
              <img
                src={
                  responsible.logoUrl
                }
                alt=""
                width="108"
                height="108"
                style={{
                  width: "108px",
                  height: "108px",
                  objectFit: "cover",
                  borderRadius:
                    "999px",
                  border:
                    "4px solid white",
                  backgroundColor:
                    "#ffffff",
                }}
              />
            ) : (
              <div
                style={{
                  width: "108px",
                  height: "108px",
                  borderRadius:
                    "999px",
                  backgroundColor:
                    "#ffffff",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  color: "#222222",
                  fontSize: "44px",
                  fontWeight: 800,
                }}
              >
                {responsible.name
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div
              style={{
                marginLeft: "22px",
                display: "flex",
                flexDirection:
                  "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  color:
                    "rgba(255,255,255,0.76)",
                  fontSize: "23px",
                }}
              >
                Prise en charge par
              </div>

              <div
                style={{
                  display: "flex",
                  marginTop: "5px",
                  color: "#ffffff",
                  fontSize: "34px",
                  fontWeight: 700,
                }}
              >
                {responsible.name}
              </div>
            </div>
          </div>

          {tauiLogoUrl ? (
            <img
              src={tauiLogoUrl}
              alt="Taui Te Ora"
              width="190"
              height="105"
              style={{
                position:
                  "absolute",
                right: "58px",
                bottom: "60px",
                width: "190px",
                height: "105px",
                objectFit:
                  "contain",
              }}
            />
          ) : (
            <div
              style={{
                position:
                  "absolute",
                right: "58px",
                bottom: "72px",
                display: "flex",
                color: "#ffffff",
                fontSize: "26px",
                fontWeight: 800,
                letterSpacing:
                  "0.6px",
              }}
            >
              TAUI TE ORA
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 1200,

        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=300",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erreur génération image Facebook :",
      error
    );

    return new Response(
      "Erreur génération image.",
      {
        status: 500,
      }
    );
  }
}
