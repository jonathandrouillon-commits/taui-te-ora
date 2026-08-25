import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";

import TauiPageBackground from "../../components/ui/TauiPageBackground";
import { supabase } from "../../lib/supabase";

type PublicSitePage = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const RESERVED_SLUGS = new Set([
  "admin",
  "adoptant",
  "adoption",
  "alimentation",
  "animal",
  "association",
  "associations",
  "benevole",
  "boutique",
  "choose-role",
  "conseils-sante",
  "dashboard",
  "education",
  "favorites",
  "forgot-password",
  "fourriere",
  "gardiennage",
  "hommage",
  "login",
  "messages",
  "notifications",
  "pending-approval",
  "pension",
  "profile",
  "refuge",
  "register",
  "report",
  "search",
  "signalement",
  "structure",
  "toilettage",
  "update-password",
  "veterinaires",
]);

function cleanSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 100);
}

function sanitizeContent(content: string | null) {
  if (!content) {
    return "";
  }

  return sanitizeHtml(content, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "h1",
      "h2",
      "h3",
      "h4",
      "blockquote",
      "ul",
      "ol",
      "li",
      "a",
      "hr",
      "span",
    ],
    allowedAttributes: {
      a: [
        "href",
        "target",
        "rel",
      ],
    },
    allowedSchemes: [
      "http",
      "https",
      "mailto",
      "tel",
    ],
    transformTags: {
      a: sanitizeHtml.simpleTransform(
        "a",
        {
          rel: "noopener noreferrer",
        },
        true
      ),
    },
    disallowedTagsMode: "discard",
  });
}

export default async function PublicSitePage({
  params,
}: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = cleanSlug(rawSlug);

  if (!slug) {
    notFound();
  }

  /*
   * Les pages administrables vivent volontairement sous /pages/[slug].
   * Cette liste protège également les noms des routes système si, plus tard,
   * une navigation tente de réutiliser directement un slug réservé.
   */
  if (RESERVED_SLUGS.has(slug)) {
    notFound();
  }

  const { data, error } = await supabase
    .from("site_pages")
    .select(
      `
        id,
        slug,
        title,
        subtitle,
        content,
        image_url
      `
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error(
      "Erreur chargement page publique :",
      error
    );

    notFound();
  }

  if (!data) {
    notFound();
  }

  const page =
    data as PublicSitePage;

  const safeContent =
    sanitizeContent(page.content);

  return (
    <TauiPageBackground>
      <main className="min-h-[100dvh] px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
        <article className="mx-auto w-full max-w-4xl overflow-hidden rounded-[32px] bg-white/95 shadow-xl backdrop-blur">
          {page.image_url ? (
            <div className="w-full bg-[#f8f4ec]">
              <img
                src={page.image_url}
                alt={page.title}
                className="max-h-[480px] w-full object-cover"
              />
            </div>
          ) : null}

          <div className="p-6 sm:p-9 md:p-12">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#df8995]">
              TAUI TE ORA
            </p>

            <h1 className="mt-3 text-3xl font-black leading-tight text-[#064b42] sm:text-4xl md:text-5xl">
              {page.title}
            </h1>

            {page.subtitle ? (
              <p className="mt-4 text-lg font-semibold leading-7 text-[#6f665f] sm:text-xl">
                {page.subtitle}
              </p>
            ) : null}

            {safeContent ? (
              <div
                className="
                  mt-8
                  space-y-4
                  text-[16px]
                  leading-8
                  text-[#3f3a36]
                  [&_a]:font-black
                  [&_a]:text-[#df8995]
                  [&_a]:underline
                  [&_blockquote]:border-l-4
                  [&_blockquote]:border-[#efd5d7]
                  [&_blockquote]:pl-5
                  [&_h1]:mt-8
                  [&_h1]:text-3xl
                  [&_h1]:font-black
                  [&_h1]:text-[#064b42]
                  [&_h2]:mt-8
                  [&_h2]:text-2xl
                  [&_h2]:font-black
                  [&_h2]:text-[#064b42]
                  [&_h3]:mt-7
                  [&_h3]:text-xl
                  [&_h3]:font-black
                  [&_h3]:text-[#064b42]
                  [&_li]:ml-5
                  [&_ol]:list-decimal
                  [&_p]:my-4
                  [&_ul]:list-disc
                "
                dangerouslySetInnerHTML={{
                  __html: safeContent,
                }}
              />
            ) : (
              <p className="mt-8 text-[#6f665f]">
                Cette page ne contient pas encore de texte.
              </p>
            )}
          </div>
        </article>
      </main>
    </TauiPageBackground>
  );
}