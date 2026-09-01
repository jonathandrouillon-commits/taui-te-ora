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

  if (!supabaseUrl || !serviceRoleKey) {
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

export default async function OpenGraphImage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = getSupabase();

  /*
   * ==============================
   * ANIMAL
   * ==============================
   */

  const {
    data: animal,
    error: animalError,
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
      owner_id
    `)
    .eq("id", id)
    .maybeSingle();

  if (animalError) {
    console.error(
      "Erreur OpenGraph animal :",
      animalError
    );
  }

  /*
   * ==============================
   * PHOTOS
   * ==============================
   */

  const {
    data: photoRows,
    error: photoError,
  } = await supabase
    .from("animal_photos")
    .select(`
      photo_url,
      is_cover,
      sort_order
    `)
    .eq("animal_id", id)
    .order("is_cover", {
      ascending: false,
    })
    .order("sort_order", {
      ascending: true,
    });

  if (photoError) {
    console.error(
      "Erreur OpenGraph photos :",
      photoError
    );
  }

  const photos =
    (photoRows || []) as AnimalPhoto[];

  const mainPhoto =
    photos.find(
      (photo) =>
        photo.is_cover &&
        photo.photo_url
    )?.photo_url ||
    photos.find(
      (photo) =>
        Boolean(photo.photo_url)
    )?.photo_url ||
    animal?.photo_url ||
    "";

  /*
   * ==============================
   * STRUCTURE
   * ==============================
   */

  let structureName =
    animal?.association_name ||
    "TAUI TE ORA";

  let structureLogo = "";

  if (animal?.owner_id) {
    const {
      data: ownerProfile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(`
        id,
        organization_name,
        first_name,
        last_name,
        avatar_url
      `)
      .eq(
        "id",
        animal.owner_id
      )
      .maybeSingle();

    if (profileError) {
      console.error(
        "Erreur OpenGraph structure :",
        profileError
      );
    }

    if (ownerProfile) {
      structureName =
        ownerProfile.organization_name ||
        [
          ownerProfile.first_name,
          ownerProfile.last_name,
        ]
          .filter(Boolean)
          .join(" ") ||
        structureName;

      structureLogo =
        ownerProfile.avatar_url ||
        "";
    }
  }

  /*
   * ==============================
   * INFORMATIONS
   * ==============================
   */

  const name =
    animal?.animal_name ||
    "Animal";

  const age =
    animal?.age_label || "";

  const sex =
    animal?.sex || "";

  const city =
    animal?.city || "";

  const island =
    animal?.island || "";

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "1200px",
          height: "630px",
          display: "flex",
          background: "#d9d4cf",
          overflow: "hidden",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        {/* PHOTO */}

        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt=""
            width="1200"
            height="630"
            style={{
              position: "absolute",
              inset: 0,
              width: "1200px",
              height: "630px",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "1200px",
              height: "630px",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              background: "#e8e1d8",
              fontSize: "180px",
            }}
          >
            🐾
          </div>
        )}

        {/* DEGRADE */}

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "330px",
            display: "flex",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.45), rgba(0,0,0,0))",
          }}
        />

        {/* LOGO TAUI */}

        <div
          style={{
            position: "absolute",
            top: "26px",
            left: "50%",
            transform:
              "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            width: "112px",
            height: "112px",
            borderRadius: "56px",
            background:
              "rgba(255,255,255,0.92)",
            boxShadow:
              "0 6px 24px rgba(0,0,0,.20)",
          }}
        >
          <img
            src="https://www.taui-te-ora.com/logo-taui-te-ora.png"
            alt=""
            width="94"
            height="94"
            style={{
              objectFit: "contain",
            }}
          />
        </div>

        {/* COLONNE HAUT DROITE */}

        <div
          style={{
            position: "absolute",
            top: "30px",
            right: "30px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "13px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              borderRadius: "30px",
              background:
                "rgba(255,255,255,.94)",
              padding: "11px 17px",
              fontSize: "25px",
              fontWeight: 800,
              color: "#ef8196",
            }}
          >
            ♥
          </div>

          <div
            style={{
              width: "55px",
              height: "55px",
              borderRadius: "28px",
              background:
                "rgba(255,255,255,.94)",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              fontSize: "28px",
            }}
          >
            🐾
          </div>

          <div
            style={{
              width: "55px",
              height: "55px",
              borderRadius: "28px",
              background: "#1877F2",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              fontSize: "36px",
              fontWeight: 900,
            }}
          >
            f
          </div>
        </div>

        {/* INFORMATIONS BAS */}

        <div
          style={{
            position: "absolute",
            left: "55px",
            right: "55px",
            bottom: "42px",
            display: "flex",
            flexDirection: "column",
            color: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "22px",
            }}
          >
            <span
              style={{
                fontSize: "68px",
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {name}
            </span>

            {age && (
              <span
                style={{
                  fontSize: "30px",
                  fontWeight: 600,
                }}
              >
                {age}
              </span>
            )}
          </div>

          {sex && (
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                fontSize: "26px",
                fontWeight: 700,
              }}
            >
              {sex}
            </div>
          )}

          {(city || island) && (
            <div
              style={{
                marginTop: "11px",
                display: "flex",
                fontSize: "25px",
                fontWeight: 600,
              }}
            >
              📍{" "}
              {[city, island]
                .filter(Boolean)
                .join(" · ")}
            </div>
          )}

          {/* STRUCTURE */}

          <div
            style={{
              marginTop: "22px",
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            {structureLogo ? (
              <img
                src={structureLogo}
                alt=""
                width="60"
                height="60"
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "30px",
                  objectFit: "cover",
                  background: "white",
                  border:
                    "3px solid white",
                }}
              />
            ) : (
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "30px",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  fontSize: "29px",
                }}
              >
                🐾
              </div>
            )}

            <span
              style={{
                fontSize: "25px",
                fontWeight: 800,
              }}
            >
              {structureName}
            </span>
          </div>

          <div
            style={{
              marginTop: "14px",
              display: "flex",
              fontSize: "21px",
              color:
                "rgba(255,255,255,.90)",
            }}
          >
            Découvrez {name} sur TAUI TE ORA
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}