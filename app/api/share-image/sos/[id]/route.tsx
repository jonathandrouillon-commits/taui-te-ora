import {
  ImageResponse,
} from "next/og";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime =
  "nodejs";

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
        persistSession:
          false,
        autoRefreshToken:
          false,
      },
    }
  );
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
  if (
    value ===
    "critique"
  ) {
    return "🚨 CRITIQUE";
  }

  if (
    value ===
    "urgente"
  ) {
    return "⚠️ URGENTE";
  }

  return "ℹ️ NORMALE";
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
          "id,title,help_type,island,city,message,urgency,status,animal_type,animals_count,created_at"
        )
        .eq("id", id)
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

    const tauiLogoUrl =
      process.env.TAUI_LOGO_URL ||
      "https://www.taui-te-ora.com/logo-taui-te-ora.png";

    const location =
      [
        data.city,
        data.island,
      ]
        .filter(Boolean)
        .join(" · ");

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
            justifyContent:
              "space-between",
            background:
              "linear-gradient(135deg, #fff7f7 0%, #fffdf9 50%, #f8efe8 100%)",
            padding:
              "72px",
            fontFamily:
              "Arial, Helvetica, sans-serif",
            color:
              "#064b42",
          }}
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
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
                    "32px",
                  fontWeight:
                    900,
                  letterSpacing:
                    "2px",
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
                    "8px",
                  fontSize:
                    "24px",
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
              width="190"
              height="110"
              style={{
                width:
                  "190px",
                height:
                  "110px",
                objectFit:
                  "contain",
              }}
            />
          </div>

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
                  data.urgency ===
                  "critique"
                    ? "#fee2e2"
                    : data.urgency ===
                      "urgente"
                    ? "#fef3c7"
                    : "#e7f3ef",
                color:
                  data.urgency ===
                  "critique"
                    ? "#b91c1c"
                    : data.urgency ===
                      "urgente"
                    ? "#92400e"
                    : "#064b42",
                padding:
                  "16px 24px",
                fontSize:
                  "25px",
                fontWeight:
                  900,
              }}
            >
              {urgencyLabel(
                data.urgency
              )}
            </div>

            <div
              style={{
                display:
                  "flex",
                marginTop:
                  "30px",
                fontSize:
                  "72px",
                lineHeight:
                  1.05,
                fontWeight:
                  900,
                letterSpacing:
                  "-2px",
                color:
                  "#2f241c",
              }}
            >
              {data.title}
            </div>

            <div
              style={{
                display:
                  "flex",
                marginTop:
                  "36px",
                flexDirection:
                  "column",
                gap:
                  "18px",
                fontSize:
                  "33px",
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
                  data.help_type
                )}
              </div>

              <div
                style={{
                  display:
                    "flex",
                }}
              >
                📍 {location}
              </div>
            </div>
          </div>

          <div
            style={{
              display:
                "flex",
              backgroundColor:
                "#ffffff",
              borderRadius:
                "30px",
              padding:
                "30px 34px",
              boxShadow:
                "0 12px 40px rgba(6,75,66,0.10)",
              flexDirection:
                "column",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                fontSize:
                  "21px",
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
                  "10px",
                fontSize:
                  "27px",
                lineHeight:
                  1.35,
                fontWeight:
                  700,
                color:
                  "#5f554d",
              }}
            >
              {String(
                data.message ||
                  ""
              ).slice(
                0,
                220
              )}
              {String(
                data.message ||
                  ""
              ).length >
              220
                ? "…"
                : ""}
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
            "public, max-age=300, s-maxage=300",
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

