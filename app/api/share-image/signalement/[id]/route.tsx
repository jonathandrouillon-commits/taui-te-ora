import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Signalement = {
  id: string;
  type_signalement: string | null;
  animal_type: string | null;
  animal_name: string | null;
  sex: string | null;
  age_label: string | null;
  breed: string | null;
  color: string | null;
  collar_color: string | null;
  distinctive_features: string | null;
  city: string | null;
  island: string | null;
  disappearance_at: string | null;
  found_at: string | null;
};

type Media = {
  file_url: string | null;
  file_type: string | null;
};

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function clean(value: string | null | undefined) {
  return String(value || "").trim();
}

function isSafeImageUrl(value: string | null): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);

    if (url.protocol !== "https:") return false;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) return false;

    const trustedHost = new URL(supabaseUrl).hostname;

    return (
      url.hostname === trustedHost &&
      url.pathname.includes("/storage/v1/object/")
    );
  } catch {
    return false;
  }
}

function isImage(media: Media) {
  if (!isSafeImageUrl(media.file_url)) return false;

  const type = clean(media.file_type).toLowerCase();

  return !type || type.startsWith("image/");
}

function getAlertTitle(type: string | null) {
  const value = clean(type).toLowerCase();

  if (value.includes("perdu")) return "ALERTE DISPARITION";
  if (value.includes("trouv")) return "ANIMAL TROUVÉ";
  if (value.includes("bless")) return "ANIMAL BLESSÉ";
  if (value.includes("errant")) return "ANIMAL ERRANT";
  if (value.includes("maltrait")) return "SIGNALEMENT";
  if (value.includes("mort") || value.includes("décéd")) {
    return "ANIMAL DÉCÉDÉ";
  }

  return "ALERTE ANIMALE";
}

function getSubtitle(type: string | null) {
  const value = clean(type).toLowerCase();

  if (value.includes("perdu")) return "AIDEZ-NOUS À LE RETROUVER";
  if (value.includes("trouv")) return "AIDEZ-NOUS À RETROUVER SA FAMILLE";

  return "LA COMMUNAUTÉ SE MOBILISE";
}

function formatDate(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Pacific/Tahiti",
  }).format(date);
}

function shorten(value: string, limit: number) {
  if (value.length <= limit) return value;

  return value.slice(0, limit - 1).trimEnd() + "…";
}

function toBase64(bytes: Uint8Array) {
  let binary = "";

  const chunkSize = 8192;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);

    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }

  return btoa(binary);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return new Response("Identifiant invalide", {
        status: 400,
      });
    }

    const supabase = getAdmin();

    if (!supabase) {
      return new Response("Configuration Supabase manquante", {
        status: 500,
      });
    }

    const { data, error } = await supabase
      .from("signalements")
      .select(
        [
          "id",
          "type_signalement",
          "animal_type",
          "animal_name",
          "sex",
          "age_label",
          "breed",
          "color",
          "collar_color",
          "distinctive_features",
          "city",
          "island",
          "disappearance_at",
          "found_at",
        ].join(",")
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      console.error("Signalement image :", error);

      return new Response("Signalement introuvable", {
        status: 404,
      });
    }

    const signalement = data as unknown as Signalement;

    const { data: mediaData, error: mediaError } = await supabase
      .from("signalement_medias")
      .select("file_url,file_type")
      .eq("signalement_id", id)
      .limit(30);

    if (mediaError) {
      console.error("Médias image :", mediaError);
    }

    const medias = (mediaData || []) as Media[];

    const photoUrl = medias.find(isImage)?.file_url || null;

    let photoData: string | null = null;

    if (photoUrl) {
      try {
        const photoResponse = await fetch(photoUrl, {
          cache: "no-store",
        });

        if (photoResponse.ok) {
          const contentType = (
            photoResponse.headers.get("content-type") || ""
          ).split(";")[0].toLowerCase();

          const supported = [
            "image/jpeg",
            "image/png",
            "image/webp",
          ];

          if (supported.includes(contentType)) {
            const photoBytes = new Uint8Array(
              await photoResponse.arrayBuffer()
            );

            if (photoBytes.byteLength <= 8 * 1024 * 1024) {
              photoData = `data:${contentType};base64,${toBase64(
                photoBytes
              )}`;
            }
          }
        }
      } catch (photoError) {
        console.error("Photo indisponible :", photoError);
      }
    }

    const type = getAlertTitle(signalement.type_signalement);
    const subtitle = getSubtitle(signalement.type_signalement);

    const name = shorten(
      clean(signalement.animal_name) ||
        clean(signalement.animal_type) ||
        "ANIMAL SIGNALÉ",
      24
    ).toUpperCase();

    const location = [
      clean(signalement.city),
      clean(signalement.island),
    ]
      .filter(Boolean)
      .join(" • ");

    const description = [
      clean(signalement.animal_type),
      clean(signalement.breed),
      clean(signalement.sex),
      clean(signalement.age_label),
    ]
      .filter(Boolean)
      .join(" • ");

    const appearance = [
      clean(signalement.color),
      clean(signalement.collar_color)
        ? `Collier : ${clean(signalement.collar_color)}`
        : "",
    ]
      .filter(Boolean)
      .join(" • ");

    const isLost = clean(signalement.type_signalement)
      .toLowerCase()
      .includes("perdu");

    const eventDate = formatDate(
      isLost
        ? signalement.disappearance_at
        : signalement.found_at
    );

    const features = shorten(
      clean(signalement.distinctive_features),
      125
    );

    const publicUrl = `www.taui-te-ora.com`;

    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 1200,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#ffffff",
            fontFamily: "Arial, sans-serif",
            overflow: "hidden",
          }}
        >
          {/* BANDEAU D'ALERTE */}
          <div
            style={{
              height: 205,
              backgroundColor: "#dc111b",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 35px",
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#ffdf25",
                fontSize: 70,
                fontWeight: 900,
                letterSpacing: 1,
                textAlign: "center",
              }}
            >
              {type}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 12,
                color: "#ffffff",
                fontSize: 30,
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              {subtitle}
            </div>
          </div>

          {/* NOM */}
          <div
            style={{
              height: 145,
              backgroundColor: "#ffdf25",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "12px 30px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: name.length > 15 ? 65 : 87,
                fontWeight: 900,
                color: "#101010",
                textAlign: "center",
              }}
            >
              {name}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 25,
                fontWeight: 800,
                color: "#a51218",
              }}
            >
              {clean(signalement.type_signalement).toUpperCase()}
            </div>
          </div>

          {/* PHOTO ET INFORMATIONS */}
          <div
            style={{
              height: 655,
              display: "flex",
              padding: 30,
              gap: 26,
              backgroundColor: "#fffaf1",
            }}
          >
            <div
              style={{
                width: 530,
                height: 595,
                display: "flex",
                position: "relative",
                overflow: "hidden",
                borderRadius: 20,
                backgroundColor: "#e5e7eb",
                border: "5px solid #ffffff",
              }}
            >
              {photoData ? (
                <img
                  src={photoData}
                  width={530}
                  height={595}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#e7f2ee",
                    color: "#064b42",
                    fontSize: 32,
                    fontWeight: 800,
                  }}
                >
                  PHOTO NON DISPONIBLE
                </div>
              )}
            </div>

            <div
              style={{
                width: 575,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                justifyContent: "center",
              }}
            >
              {description && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      color: "#bd141b",
                      fontSize: 23,
                      fontWeight: 900,
                    }}
                  >
                    DESCRIPTION
                  </div>
                  <div
                    style={{
                      display: "flex",
                      color: "#142b27",
                      fontSize: 27,
                      fontWeight: 700,
                    }}
                  >
                    {shorten(description, 100)}
                  </div>
                </div>
              )}

              {location && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      color: "#bd141b",
                      fontSize: 23,
                      fontWeight: 900,
                    }}
                  >
                    SECTEUR SIGNALÉ
                  </div>
                  <div
                    style={{
                      display: "flex",
                      color: "#142b27",
                      fontSize: 31,
                      fontWeight: 900,
                    }}
                  >
                    {shorten(location, 65)}
                  </div>
                </div>
              )}

              {eventDate && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      color: "#bd141b",
                      fontSize: 23,
                      fontWeight: 900,
                    }}
                  >
                    {isLost ? "DISPARU LE" : "DATE DU SIGNALEMENT"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      color: "#142b27",
                      fontSize: 29,
                      fontWeight: 800,
                    }}
                  >
                    {eventDate}
                  </div>
                </div>
              )}

              {appearance && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      color: "#bd141b",
                      fontSize: 23,
                      fontWeight: 900,
                    }}
                  >
                    APPARENCE
                  </div>
                  <div
                    style={{
                      display: "flex",
                      color: "#142b27",
                      fontSize: 26,
                      fontWeight: 700,
                    }}
                  >
                    {shorten(appearance, 90)}
                  </div>
                </div>
              )}

              {features && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      color: "#bd141b",
                      fontSize: 23,
                      fontWeight: 900,
                    }}
                  >
                    SIGNES PARTICULIERS
                  </div>
                  <div
                    style={{
                      display: "flex",
                      color: "#142b27",
                      fontSize: 24,
                      fontWeight: 700,
                    }}
                  >
                    {features}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* APPEL AU PARTAGE */}
          <div
            style={{
              height: 100,
              backgroundColor: "#ffdf25",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 39,
                fontWeight: 900,
                color: "#101010",
                textAlign: "center",
              }}
            >
              PARTAGEZ CETTE ALERTE !
            </div>
          </div>

          {/* SIGNATURE */}
          <div
            style={{
              height: 95,
              backgroundColor: "#064b42",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "15px 38px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                color: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 29,
                  fontWeight: 900,
                }}
              >
                TAUI TE ORA
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 17,
                }}
              >
                by Les Veilleurs de Kali
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 27,
                fontWeight: 800,
                color: "#ffdf25",
              }}
            >
              {publicUrl}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 1200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Erreur image signalement :", error);

    return new Response(
      "Impossible de générer l'image du signalement",
      {
        status: 500,
      }
    );
  }
}