import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type AnimalPhoto = {
  photo_url: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
};

function getSupabase() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Configuration Supabase manquante."
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

export default async function OpenGraphImage(
  { params }: Props
) {
  const { id } = await params;

  const supabase =
    getSupabase();

  const {
    data: animal,
  } = await supabase
    .from("animals")
    .select(`
      id,
      animal_name,
      animal_type,
      age_label,
      sex,
      breed,
      island,
      city,
      photo_url,
      association_name,
      owner_id,
      owner_profile:profiles!animals_owner_id_fkey(
        id,
        organization_name,
        avatar_url
      )
    `)
    .eq("id", id)
    .maybeSingle();

  const {
    data: photoRows,
  } = await supabase
    .from("animal_photos")
    .select(`
      photo_url,
      is_cover,
      sort_order
    `)
    .eq("animal_id", id)
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

  const photos =
    (photoRows ||
      []) as AnimalPhoto[];

  const mainPhoto =
    photos.find(
      (photo) =>
        photo.is_cover &&
        photo.photo_url
    )?.photo_url ||
    photos.find(
      (photo) =>
        photo.photo_url
    )?.photo_url ||
    animal?.photo_url ||
    "";

  const name =
    animal?.animal_name ||
    "Animal";

  const age =
    animal?.age_label ||
    "";

  const sex =
    animal?.sex ||
    "";

  const city =
    animal?.city ||
    "";

  const island =
    animal?.island ||
    "";

  const ownerProfile =
    Array.isArray(
      animal?.owner_profile
    )
      ? animal?.owner_profile?.[0]
      : animal?.owner_profile;

  const structureName =
    ownerProfile
      ?.organization_name ||
    animal?.association_name ||
    "TAUI TE ORA";

  const structureLogo =
    ownerProfile
      ?.avatar_url ||
    "";

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "1200px",
          height: "630px",
          display: "flex",
          background:
            "#d9d4cf",
          overflow: "hidden",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        {/* PHOTO PRINCIPALE */}

        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt=""
            width="1200"
            height="630"
            style={{
              position:
                "absolute",
              inset: 0,
              width: "1200px",
              height: "630px",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position:
                "absolute",
              inset: 0,
              width: "1200px",
              height: "630px",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              background:
                "#e8e1d8",
              fontSize: "180px",
            }}
          >
            🐾
          </div>
        )}

        {/* DÉGRADÉ BAS */}

        <div
          style={{
            position:
              "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "330px",
            display: "flex",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.90), rgba(0,0,0,0.50), rgba(0,0,0,0))",
          }}
        />

        {/* LOGO TAUI TE ORA EN HAUT */}

        <div
          style={{
            position:
              "absolute",
            top: "26px",
            left: "50%",
            transform:
              "translateX(-50%)",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            width: "120px",
            height: "120px",
            borderRadius:
              "60px",
            background:
              "rgba(255,255,255,0.90)",
            boxShadow:
              "0 6px 24px rgba(0,0,0,0.20)",
          }}
        >
          <img
            src="https://www.taui-te-ora.com/logo-taui-te-ora.png"
            alt=""
            width="100"
            height="100"
            style={{
              objectFit:
                "contain",
            }}
          />
        </div>

        {/* COLONNE DROITE */}

        <div
          style={{
            position:
              "absolute",
            top: "30px",
            right: "30px",
            display: "flex",
            flexDirection:
              "column",
            alignItems:
              "center",
            gap: "14px",
          }}
        >
          {/* COEUR */}

          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              gap: "8px",
              borderRadius:
                "30px",
              background:
                "rgba(255,255,255,0.93)",
              padding:
                "11px 18px",
              fontSize: "25px",
              fontWeight: 800,
            }}
          >
            <span
              style={{
                color:
                  "#ef8196",
              }}
            >
              ♥
            </span>

            <span
              style={{
                color:
                  "#52504d",
              }}
            >
              TAUI
            </span>
          </div>

          {/* PATTE */}

          <div
            style={{
              width: "58px",
              height: "58px",
              borderRadius:
                "29px",
              background:
                "rgba(255,255,255,0.94)",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              fontSize: "29px",
              boxShadow:
                "0 4px 18px rgba(0,0,0,0.18)",
            }}
          >
            🐾
          </div>

          {/* FACEBOOK */}

          <div
            style={{
              width: "58px",
              height: "58px",
              borderRadius:
                "29px",
              background:
                "#1877F2",
              color: "white",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              fontSize: "38px",
              fontWeight: 900,
              boxShadow:
                "0 4px 18px rgba(0,0,0,0.18)",
            }}
          >
            f
          </div>
        </div>

        {/* INFORMATIONS ANIMAL */}

        <div
          style={{
            position:
              "absolute",
            left: "55px",
            right: "55px",
            bottom: "45px",
            display: "flex",
            flexDirection:
              "column",
            color: "white",
          }}
        >
          {/* NOM */}

          <div
            style={{
              display: "flex",
              alignItems:
                "baseline",
              gap: "22px",
            }}
          >
            <span
              style={{
                fontSize:
                  "67px",
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {name}
            </span>

            {age && (
              <span
                style={{
                  fontSize:
                    "30px",
                  fontWeight: 600,
                }}
              >
                {age}
              </span>
            )}
          </div>

          {/* SEXE */}

          {sex && (
            <div
              style={{
                marginTop:
                  "14px",
                display:
                  "flex",
                fontSize:
                  "26px",
                fontWeight: 700,
              }}
            >
              {sex}
            </div>
          )}

          {/* LOCALISATION */}

          {(city ||
            island) && (
            <div
              style={{
                marginTop:
                  "12px",
                display:
                  "flex",
                fontSize:
                  "25px",
                fontWeight: 600,
              }}
            >
              📍{" "}
              {[city, island]
                .filter(
                  Boolean
                )
                .join(" · ")}
            </div>
          )}

          {/* STRUCTURE */}

          <div
            style={{
              marginTop:
                "24px",
              display: "flex",
              alignItems:
                "center",
              gap: "16px",
            }}
          >
            {structureLogo ? (
              <img
                src={
                  structureLogo
                }
                alt=""
                width="58"
                height="58"
                style={{
                  width:
                    "58px",
                  height:
                    "58px",
                  borderRadius:
                    "29px",
                  objectFit:
                    "cover",
                  background:
                    "white",
                  border:
                    "3px solid white",
                }}
              />
            ) : (
              <div
                style={{
                  width:
                    "58px",
                  height:
                    "58px",
                  borderRadius:
                    "29px",
                  background:
                    "white",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontSize:
                    "28px",
                }}
              >
                🐾
              </div>
            )}

            <span
              style={{
                fontSize:
                  "25px",
                fontWeight: 800,
              }}
            >
              {structureName}
            </span>
          </div>

          {/* MESSAGE */}

          <div
            style={{
              marginTop:
                "16px",
              display: "flex",
              fontSize:
                "21px",
              color:
                "rgba(255,255,255,0.90)",
            }}
          >
            Découvrez sa fiche sur
            TAUI TE ORA
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}