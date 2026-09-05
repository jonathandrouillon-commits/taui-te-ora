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

  if (
    !url ||
    !serviceRole
  ) {
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

function paceLabel(
  value:
    | string
    | null
    | undefined
) {
  if (
    value ===
    "calme"
  ) {
    return "Tranquille";
  }

  if (
    value ===
    "sportive"
  ) {
    return "Sportif";
  }

  return "Modéré";
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

    const supabase =
      getSupabaseAdmin();

    const {
      data:
        walk,
      error:
        walkError,
    } =
      await supabase
        .from(
          "community_walks"
        )
        .select(
          "id,title,location,starts_at,duration_minutes,max_dogs,pace,audience,status"
        )
        .eq(
          "id",
          id
        )
        .maybeSingle();

    if (
      walkError ||
      !walk
    ) {
      return new Response(
        "Balade introuvable.",
        {
          status: 404,
        }
      );
    }

    const {
      count:
        acceptedCount,
    } =
      await supabase
        .from(
          "walk_participants"
        )
        .select(
          "id",
          {
            count:
              "exact",
            head:
              true,
          }
        )
        .eq(
          "walk_id",
          id
        )
        .eq(
          "status",
          "accepted"
        );

    const tauiLogoUrl =
      process.env.TAUI_LOGO_URL ||
      "https://www.taui-te-ora.com/logo-taui-te-ora.png";

    const dateText =
      new Intl.DateTimeFormat(
        "fr-FR",
        {
          dateStyle:
            "full",
          timeStyle:
            "short",
          timeZone:
            "Pacific/Tahiti",
        }
      ).format(
        new Date(
          walk.starts_at
        )
      );

    const places =
      `${acceptedCount || 0}/${walk.max_dogs} chiens`;

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
              "linear-gradient(135deg, #f4eee3 0%, #fffdf9 48%, #e5f4ef 100%)",
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
                    "30px",
                  fontWeight:
                    800,
                  letterSpacing:
                    "2px",
                  textTransform:
                    "uppercase",
                  color:
                    "#d96b4c",
                }}
              >
                🐾 BALADE & COPAINS
              </div>

              <div
                style={{
                  display:
                    "flex",
                  marginTop:
                    "10px",
                  fontSize:
                    "24px",
                  color:
                    "#416c66",
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
                fontSize:
                  "74px",
                lineHeight:
                  1.04,
                fontWeight:
                  900,
                letterSpacing:
                  "-2px",
                color:
                  "#2f241c",
              }}
            >
              {walk.title}
            </div>

            <div
              style={{
                display:
                  "flex",
                marginTop:
                  "42px",
                flexDirection:
                  "column",
                gap:
                  "20px",
                fontSize:
                  "34px",
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
                📍 {walk.location}
              </div>

              <div
                style={{
                  display:
                    "flex",
                }}
              >
                📅 {dateText}
              </div>

              <div
                style={{
                  display:
                    "flex",
                }}
              >
                🚶 {walk.duration_minutes} min · {paceLabel(walk.pace)}
              </div>

              <div
                style={{
                  display:
                    "flex",
                }}
              >
                🐕 {walk.audience}
              </div>
            </div>
          </div>

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              backgroundColor:
                "#ffffff",
              borderRadius:
                "30px",
              padding:
                "28px 34px",
              boxShadow:
                "0 12px 40px rgba(6,75,66,0.12)",
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
                    "22px",
                  color:
                    "#9c7b54",
                  fontWeight:
                    700,
                }}
              >
                Participants
              </div>

              <div
                style={{
                  display:
                    "flex",
                  marginTop:
                    "4px",
                  fontSize:
                    "38px",
                  fontWeight:
                    900,
                  color:
                    "#064b42",
                }}
              >
                {places}
              </div>
            </div>

            <div
              style={{
                display:
                  "flex",
                borderRadius:
                  "999px",
                backgroundColor:
                  "#ef7f61",
                color:
                  "#ffffff",
                padding:
                  "18px 28px",
                fontSize:
                  "25px",
                fontWeight:
                  900,
              }}
            >
              Rejoindre la balade
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
      "Erreur image partage balade :",
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
