
import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Signalement = {
  id: string;
  type_signalement: string | null;
  animal_type: string | null;
  animal_name: string | null;
  city: string | null;
  island: string | null;
};

type Media = {
  file_url: string | null;
  file_type: string | null;
};

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isSafeUrl(value: string | null): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isImage(media: Media) {
  if (!isSafeUrl(media.file_url)) return false;

  const type = (media.file_type || "").toLowerCase();

  if (type.startsWith("video/")) return false;

  if (type.startsWith("image/")) return true;

  if (!type) {
    return true;
  }

  return false;
}

function getAlertTitle(type: string | null) {
  const normalized = (type || "").toLowerCase();

  if (normalized.includes("perdu")) return "ANIMAL PERDU";
  if (normalized.includes("trouv")) return "ANIMAL TROUVÉ";
  if (normalized.includes("bless")) return "ANIMAL BLESSÉ";
  if (normalized.includes("errant")) return "ANIMAL ERRANT";
  if (normalized.includes("maltrait")) return "SIGNALEMENT MALTRAITANCE";
  if (normalized.includes("mort")) return "ANIMAL DÉCÉDÉ";

  return (type || "SIGNALEMENT").toUpperCase();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = getAdmin();

    if (!supabase) {
      return new Response("Configuration Supabase manquante", {
        status: 500,
      });
    }

    const { data, error } = await supabase
      .from("signalements")
      .select(
        "id,type_signalement,animal_type,animal_name,city,island"
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return new Response("Signalement introuvable", {
        status: 404,
      });
    }

    const signalement = data as Signalement;

    const { data: mediaData, error: mediaError } = await supabase
      .from("signalement_medias")
      .select("file_url,file_type")
      .eq("signalement_id", id)
      .limit(30);

    if (mediaError) {
      console.error("Erreur chargement photo :", mediaError);
    }

    const medias = (mediaData || []) as Media[];

    const photoUrl = medias.find(isImage)?.file_url || null;

    if (!photoUrl) {
      return new Response(
        "Aucune photo disponible pour ce signalement",
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const photoResponse = await fetch(photoUrl, {
      cache: "no-store",
    });

    if (!photoResponse.ok) {
      return new Response(
        "La photo du signalement est inaccessible",
        {
          status: 502,
        }
      );
    }

    const contentType =
      photoResponse.headers.get("content-type") || "";

    if (!contentType.startsWith("image/")) {
      return new Response(
        "Le fichier associé n'est pas une image",
        {
          status: 415,
        }
      );
    }

    const photoBytes = await photoResponse.arrayBuffer();

    const photoData = `data:${contentType};base64,${btoa(
      Array.from(new Uint8Array(photoBytes), (byte) =>
        String.fromCharCode(byte)
      ).join("")
    )}`;

    const type = getAlertTitle(signalement.type_signalement);

    const name =
      signalement.animal_name ||
      signalement.animal_type ||
      "Animal";

    const place = [
      signalement.city,
      signalement.island,
    ]
      .filter(Boolean)
      .join(" • ");

    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 1200,
            display: "flex",
            position: "relative",
            backgroundColor: "#064b42",
            fontFamily: "Arial, sans-serif",
            overflow: "hidden",
          }}
        >
          <img
            src={photoData}
            width={1200}
            height={1200}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: 1200,
              height: 1200,
              objectFit: "cover",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.10) 20%, rgba(0,0,0,0.92) 100%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 55,
              left: 55,
              display: "flex",
              padding: "18px 30px",
              borderRadius: 40,
              backgroundColor: "#dc2626",
              color: "#ffffff",
              fontSize: 34,
              fontWeight: 900,
            }}
          >
            ALERTE TAUI TE ORA
          </div>

          <div
            style={{
              position: "absolute",
              left: 60,
              right: 60,
              bottom: 65,
              display: "flex",
              flexDirection: "column",
              color: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 66,
                lineHeight: 1.1,
                fontWeight: 900,
              }}
            >
              {type}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 20,
                fontSize: 54,
                fontWeight: 800,
              }}
            >
              {name}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 16,
                fontSize: 34,
              }}
            >
              {place || "Polynésie française"}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 38,
                paddingTop: 25,
                borderTop: "2px solid rgba(255,255,255,0.5)",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
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
                    fontSize: 30,
                    fontWeight: 800,
                  }}
                >
                  PARTAGEZ POUR AIDER
                </div>

                <div
                  style={{
                    display: "flex",
                    fontSize: 25,
                  }}
                >
                  TAUI TE ORA by Les Veilleurs de Kali
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  fontSize: 27,
                  fontWeight: 800,
                  color: "#f3b0b8",
                }}
              >
                taui-te-ora.com
              </div>
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
