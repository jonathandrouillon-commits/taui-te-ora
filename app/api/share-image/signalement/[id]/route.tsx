import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

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
  created_at: string | null;
};

type Media = { file_url: string | null; file_type: string | null };

const W = 1280;
const H = 1280;
const GREEN = "#064b42";
const RED = "#d80b17";
const YELLOW = "#ffe329";
const clean = (value: string | null | undefined) => String(value ?? "").trim();
const shorten = (value: string, length: number) =>
  value.length > length ? `${value.slice(0, length - 1).trimEnd()}…` : value;

function kind(type: string | null) {
  const t = clean(type).toLowerCase();
  if (t.includes("perdu") || t.includes("dispar")) return "lost";
  if (t.includes("trouv")) return "found";
  if (t.includes("bless")) return "injured";
  if (t.includes("errant")) return "stray";
  if (t.includes("maltrait")) return "abuse";
  if (t.includes("mort") || t.includes("décéd") || t.includes("deced")) return "deceased";
  return "other";
}

function wording(type: string | null) {
  switch (kind(type)) {
    case "lost":
      return { title: "ALERTE DISPARITION", subtitle: "AIDONS-LE À RETROUVER SON FOYER !", advice: "VOUS L'AVEZ APERÇU ?", detail: "Ne le poursuivez pas. Signalez sa position sur TAUI TE ORA.", date: "Disparu le" };
    case "found":
      return { title: "ANIMAL TROUVÉ", subtitle: "AIDONS-LE À RETROUVER SA FAMILLE !", advice: "VOUS LE RECONNAISSEZ ?", detail: "Consultez sa fiche et transmettez toute information utile.", date: "Trouvé le" };
    case "injured":
      return { title: "ANIMAL BLESSÉ", subtitle: "UNE AIDE RAPIDE PEUT TOUT CHANGER", advice: "PRUDENCE ET SÉCURITÉ", detail: "Gardez vos distances et contactez un professionnel.", date: "Signalé le" };
    case "stray":
      return { title: "ANIMAL ERRANT", subtitle: "ENSEMBLE, RESTONS VIGILANTS", advice: "UNE INFORMATION UTILE ?", detail: "Notez le lieu et transmettez votre observation depuis la fiche.", date: "Signalé le" };
    case "abuse":
      return { title: "SIGNALEMENT ANIMAL", subtitle: "PROTÉGEONS LES ANIMAUX", advice: "NE VOUS METTEZ PAS EN DANGER", detail: "Transmettez les faits aux intervenants compétents.", date: "Signalé le" };
    case "deceased":
      return { title: "ANIMAL DÉCÉDÉ", subtitle: "AIDONS À INFORMER SA FAMILLE", advice: "VOUS LE RECONNAISSEZ ?", detail: "Consultez la fiche et transmettez les informations utiles.", date: "Signalé le" };
    default:
      return { title: "ALERTE ANIMALE", subtitle: "LA COMMUNAUTÉ SE MOBILISE", advice: "VOUS AVEZ DES INFORMATIONS ?", detail: "Consultez la fiche publique du signalement.", date: "Signalé le" };
  }
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Pacific/Tahiti",
  }).format(date);
}

function bytesToDataUri(bytes: Uint8Array, mime: string) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    const chunk = bytes.subarray(i, i + 8192);
    for (let j = 0; j < chunk.length; j++) binary += String.fromCharCode(chunk[j]);
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

async function safeImage(imageUrl: string | null | undefined, allowedHost: string) {
  if (!imageUrl) return null;
  try {
    const parsed = new URL(imageUrl);
    if (parsed.protocol !== "https:" || parsed.hostname !== allowedHost) return null;
    const response = await fetch(parsed.toString(), { cache: "no-store" });
    if (!response.ok) return null;
    const mime = (response.headers.get("content-type") || "").split(";")[0].toLowerCase();
    if (!["image/png", "image/jpeg", "image/webp"].includes(mime)) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length > 8 * 1024 * 1024) return null;
    return bytesToDataUri(bytes, mime);
  } catch {
    return null;
  }
}

async function localPng(origin: string, filename: string, maxBytes: number) {
  try {
    const response = await fetch(`${origin}/${filename}`, { cache: "no-store" });
    if (!response.ok) return null;
    const mime = (response.headers.get("content-type") || "").split(";")[0];
    if (mime !== "image/png") return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length > maxBytes) return null;
    return bytesToDataUri(bytes, "image/png");
  } catch {
    return null;
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return new Response("Identifiant invalide", { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return new Response("Configuration Supabase manquante", { status: 500 });

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.from("signalements")
      .select("id,type_signalement,animal_type,animal_name,sex,age_label,breed,color,collar_color,distinctive_features,city,island,disappearance_at,found_at,created_at")
      .eq("id", id).maybeSingle();
    if (error || !data) return new Response("Signalement introuvable", { status: 404 });
    const item = data as Signalement;

    const { data: media } = await supabase.from("signalement_medias")
      .select("file_url,file_type").eq("signalement_id", id).limit(30);
    const mediaImage = ((media || []) as Media[]).find((entry) =>
      !!entry.file_url && !clean(entry.file_type).toLowerCase().startsWith("video/") &&
      entry.file_url.includes("/storage/v1/object/")
    );
    const photo = await safeImage(mediaImage?.file_url, new URL(supabaseUrl).hostname);

    const origin = new URL(request.url).origin;
    const background = await localPng(origin, "taui-signalement-fond-auto.png", 8 * 1024 * 1024);
    if (!background) return new Response("Fond d'affiche manquant : public/taui-signalement-fond-auto.png", { status: 500 });

    const officialUrl = `https://www.taui-te-ora.com/signalement/public/${id}`;
    const qrSvg = await QRCode.toString(officialUrl, {
      type: "svg", errorCorrectionLevel: "M", margin: 2, width: 300,
      color: { dark: "#082a27", light: "#ffffff" },
    });
    const qr = `data:image/svg+xml;base64,${btoa(qrSvg)}`;

    // This template has a permanent "ALERTE DISPARITION" title.
    // Do not publish it for another reporting category.
    if (kind(item.type_signalement) !== "lost") {
      return new Response("Ce modèle est réservé aux disparitions", { status: 422 });
    }

    const name = shorten(clean(item.animal_name) || "SANS NOM", 19).toUpperCase();
    const location = [clean(item.city), clean(item.island)].filter(Boolean).join(" • ");
    const eventDate = dateLabel(item.disappearance_at || item.created_at);
    const dataRows = [
      { value: clean(item.animal_type), y: 466, max: 23 },
      { value: clean(item.sex), y: 523, max: 23 },
      { value: clean(item.age_label), y: 581, max: 23 },
      { value: clean(item.color), y: 639, max: 26 },
      { value: location, y: 695, max: 26 },
      { value: eventDate, y: 752, max: 26 },
    ];
    const features = shorten(clean(item.distinctive_features), 74);

    return new ImageResponse(
      <div style={{ display: "flex", position: "relative", width: W, height: H, overflow: "hidden", fontFamily: "Arial, sans-serif", backgroundColor: "#fffaf0" }}>
        {/* A single flat background with original tropical artwork, title, logo,
            labels and footer. No text backgrounds are generated. */}
        <img src={background} width={W} height={H} alt="" style={{ position: "absolute", top: 0, left: 0 }} />

        {/* Real animal photo replaces the illustration in its reserved area. */}
        <div style={{ display: "flex", position: "absolute", left: 42, top: 345, width: 614, height: 583, border: "7px solid #ffffff", borderRadius: 23, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "#d6e7e2" }}>
          {photo ? (
            <img src={photo} alt="" width={614} height={583} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", fontSize: 26, color: GREEN }}>PHOTO NON DISPONIBLE</div>
          )}
        </div>

        {/* Name directly on the yellow brush, without a colored box. */}
        <div style={{ display: "flex", position: "absolute", top: 314, left: 805, width: 328, height: 100, alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", fontWeight: 900, color: GREEN, fontSize: name.length > 14 ? 49 : name.length > 10 ? 61 : 83, lineHeight: 1, textAlign: "center" }}>{name}</div>
        </div>

        {/* Values are overlaid next to labels printed on the background. */}
        {dataRows.map((row, index) => row.value ? (
          <div key={index} style={{ display: "flex", position: "absolute", top: row.y, left: 1006, width: 242, height: 41, alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: row.value.length > 23 ? 19 : 24, fontWeight: 800, lineHeight: 1.08, color: GREEN }}>{shorten(row.value, row.max)}</div>
          </div>
        ) : null)}

        {/* Signs: compact and limited to the available area above the warning. */}
        {features ? (
          <div style={{ display: "flex", position: "absolute", top: 812, left: 1020, width: 230, height: 60, alignItems: "flex-start" }}>
            <div style={{ display: "flex", fontSize: 17, fontWeight: 800, lineHeight: 1.13, color: GREEN }}>{features}</div>
          </div>
        ) : null}

        {/* Unique, working QR; the white QR quiet zone is required for scanning. */}
        <div style={{ display: "flex", position: "absolute", left: 28, top: 1036, width: 198, height: 199, alignItems: "center", justifyContent: "center" }}>
          <img src={qr} alt="QR code du signalement" width={194} height={194} />
        </div>
      </div>,
      { width: W, height: H, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erreur génération affiche signalement", error);
    return new Response("Impossible de générer l'affiche", { status: 500 });
  }
}
