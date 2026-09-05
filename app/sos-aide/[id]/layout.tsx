import type {
  Metadata,
} from "next";

import {
  createClient,
} from "@supabase/supabase-js";

const SITE_URL =
  "https://www.taui-te-ora.com";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}): Promise<Metadata> {
  const {
    id,
  } =
    await params;

  const url =
    `${SITE_URL}/sos-aide/${encodeURIComponent(
      id
    )}`;

  const shareImage =
    `${SITE_URL}/api/share-image/sos/${encodeURIComponent(
      id
    )}`;

  try {
    const supabase =
      getSupabaseAdmin();

    const {
      data,
    } =
      await supabase
        .from("help_sos")
        .select(
          "title,help_type,island,city,message,urgency,status"
        )
        .eq("id", id)
        .maybeSingle();

    const title =
      data?.title
        ? `${data.title} | SOS TAUI TE ORA`
        : "SOS réseau d’aide | TAUI TE ORA";

    const description =
      data
        ? `🚨 ${data.title} · 📍 ${[
            data.city,
            data.island,
          ]
            .filter(Boolean)
            .join(" · ")}. Découvrez ce besoin sur TAUI TE ORA.`
        : "Découvrez un SOS du réseau d’aide TAUI TE ORA.";

    return {
      title,
      description,

      alternates: {
        canonical:
          url,
      },

      openGraph: {
        title,
        description,
        url,
        siteName:
          "TAUI TE ORA",
        type:
          "website",
        images: [
          {
            url:
              shareImage,
            width:
              1200,
            height:
              1200,
            alt:
              title,
          },
        ],
      },

      twitter: {
        card:
          "summary_large_image",
        title,
        description,
        images: [
          shareImage,
        ],
      },
    };
  } catch {
    return {
      title:
        "SOS réseau d’aide | TAUI TE ORA",
      description:
        "Découvrez un SOS du réseau d’aide TAUI TE ORA.",
      openGraph: {
        title:
          "SOS réseau d’aide | TAUI TE ORA",
        description:
          "Découvrez un SOS du réseau d’aide TAUI TE ORA.",
        url,
        siteName:
          "TAUI TE ORA",
        type:
          "website",
        images: [
          {
            url:
              shareImage,
            width:
              1200,
            height:
              1200,
            alt:
              "SOS TAUI TE ORA",
          },
        ],
      },
    };
  }
}

export default function SosLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return children;
}
