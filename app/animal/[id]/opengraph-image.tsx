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

type AnimalRow = {
  id: string;
  animal_name: string | null;
  animal_type: string | null;
  age_label: string | null;
  sex: string | null;
  breed: string | null;
  island: string | null;
  city: string | null;
  photo_url: string | null;
  association_name: string | null;
};

type AnimalPhotoRow = {
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

export default async function OpenGraphImage({
  params,
}: Props) {
  const { id } =
    await params;

  let animal:
    AnimalRow | null =
    null;

  let photos:
    AnimalPhotoRow[] =
    [];

  try {
    const supabase =
      getSupabase();

    const {
      data:
        animalData,
      error:
        animalError,
    } =
      await supabase
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
          association_name
        `)
        .eq(
          "id",
          id
        )
        .maybeSingle();

    if (
      animalError
    ) {
      console.error(
        "Erreur OpenGraph animal :",
        animalError
      );
    }

    if (
      animalData
    ) {
      animal =
        animalData as AnimalRow;
    }

    const {
      data:
        photoRows,
      error:
        photoError,
    } =
      await supabase
        .from(
          "animal_photos"
        )
        .select(`
          photo_url,
          is_cover,
          sort_order
        `)
        .eq(
          "animal_id",
          id
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

    if (
      photoError
    ) {
      console.error(
        "Erreur OpenGraph photos :",
        photoError
      );
    }

    photos =
      (
        photoRows ||
        []
      ) as AnimalPhotoRow[];
  } catch (
    error
  ) {
    console.error(
      "Erreur génération OpenGraph :",
      error
    );
  }

  const mainPhoto =
    photos.find(
      (
        photo
      ) =>
        photo.is_cover &&
        Boolean(
          photo.photo_url
        )
    )?.photo_url ||
    photos.find(
      (
        photo
      ) =>
        Boolean(
          photo.photo_url
        )
    )?.photo_url ||
    animal?.photo_url ||
    "";

  const name =
    animal
      ?.animal_name
      ?.trim() ||
    "Animal";

  const age =
    animal
      ?.age_label
      ?.trim() ||
    "";

  const sex =
    animal
      ?.sex
      ?.trim() ||
    "";

  const breed =
    animal
      ?.breed
      ?.trim() ||
    "";

  const city =
    animal
      ?.city
      ?.trim() ||
    "";

  const island =
    animal
      ?.island
      ?.trim() ||
    "";

  const association =
    animal
      ?.association_name
      ?.trim() ||
    "TAUI TE ORA";

  const location =
    [
      city,
      island,
    ]
      .filter(
        Boolean
      )
      .join(
        " · "
      );

  return new ImageResponse(
    (
      <div
        style={{
          width:
            "1200px",

          height:
            "630px",

          position:
            "relative",

          display:
            "flex",

          overflow:
            "hidden",

          background:
            "#064b42",

          fontFamily:
            "Arial, sans-serif",
        }}
      >
        {/* PHOTO */}

        {mainPhoto ? (
          <img
            src={
              mainPhoto
            }
            alt=""
            width={
              1200
            }
            height={
              630
            }
            style={{
              position:
                "absolute",

              inset:
                0,

              width:
                "1200px",

              height:
                "630px",

              objectFit:
                "cover",
            }}
          />
        ) : (
          <div
            style={{
              position:
                "absolute",

              inset:
                0,

              width:
                "1200px",

              height:
                "630px",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              background:
                "#dfeeea",

              fontSize:
                "180px",
            }}
          >
            🐾
          </div>
        )}

        {/* VOILE BAS */}

        <div
          style={{
            position:
              "absolute",

            left:
              0,

            right:
              0,

            bottom:
              0,

            height:
              "360px",

            display:
              "flex",

            background:
              "linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.55), rgba(0,0,0,0))",
          }}
        />

        {/* LOGO / MARQUE */}

        <div
          style={{
            position:
              "absolute",

            top:
              "32px",

            left:
              "40px",

            display:
              "flex",

            alignItems:
              "center",

            gap:
              "14px",

            borderRadius:
              "999px",

            background:
              "rgba(255,255,255,0.94)",

            padding:
              "12px 20px",

            color:
              "#064b42",

            fontSize:
              "22px",

            fontWeight:
              900,
          }}
        >
          <span>
            🐾
          </span>

          <span>
            TAUI TE ORA
          </span>
        </div>

        {/* ADOPTION */}

        <div
          style={{
            position:
              "absolute",

            top:
              "32px",

            right:
              "40px",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            borderRadius:
              "999px",

            background:
              "rgba(255,255,255,0.94)",

            padding:
              "12px 22px",

            color:
              "#df687c",

            fontSize:
              "22px",

            fontWeight:
              900,
          }}
        >
          ❤️ À ADOPTER
        </div>

        {/* INFOS */}

        <div
          style={{
            position:
              "absolute",

            left:
              "48px",

            right:
              "48px",

            bottom:
              "42px",

            display:
              "flex",

            flexDirection:
              "column",

            color:
              "white",
          }}
        >
          {/* NOM + AGE */}

          <div
            style={{
              display:
                "flex",

              alignItems:
                "baseline",

              gap:
                "22px",
            }}
          >
            <span
              style={{
                fontSize:
                  "70px",

                fontWeight:
                  900,

                lineHeight:
                  1,
              }}
            >
              {name}
            </span>

            {age ? (
              <span
                style={{
                  fontSize:
                    "30px",

                  fontWeight:
                    700,
                }}
              >
                {age}
              </span>
            ) : null}
          </div>

          {/* SEXE / RACE */}

          {(sex ||
            breed) ? (
            <div
              style={{
                marginTop:
                  "15px",

                display:
                  "flex",

                gap:
                  "14px",

                fontSize:
                  "26px",

                fontWeight:
                  700,
              }}
            >
              {sex ? (
                <span>
                  {sex}
                </span>
              ) : null}

              {sex &&
              breed ? (
                <span>
                  ·
                </span>
              ) : null}

              {breed ? (
                <span>
                  {breed}
                </span>
              ) : null}
            </div>
          ) : null}

          {/* LOCALISATION */}

          {location ? (
            <div
              style={{
                marginTop:
                  "12px",

                display:
                  "flex",

                fontSize:
                  "24px",

                fontWeight:
                  600,
              }}
            >
              📍 {location}
            </div>
          ) : null}

          {/* ASSOCIATION */}

          <div
            style={{
              marginTop:
                "20px",

              display:
                "flex",

              alignItems:
                "center",

              gap:
                "12px",

              fontSize:
                "22px",

              fontWeight:
                700,
            }}
          >
            <div
              style={{
                width:
                  "42px",

                height:
                  "42px",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                borderRadius:
                  "21px",

                background:
                  "white",

                color:
                  "#064b42",

                fontSize:
                  "22px",
              }}
            >
              🐾
            </div>

            <span>
              {association}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,

      headers: {
        "Cache-Control":
          "public, max-age=300, s-maxage=300",
      },
    }
  );
}