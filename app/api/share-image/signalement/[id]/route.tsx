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
const GREEN = "#064b42";
const RED = "#d80b17";
const YELLOW = "#ffe329";
const clean = (v: string | null | undefined) => String(v ?? "").trim();
const shorten = (v: string, n: number) => v.length > n ? `${v.slice(0, n - 1).trimEnd()}…` : v;

function kind(type: string | null) {
  const t = clean(type).toLowerCase();
  if (t.includes("perdu") || t.includes("dispar")) return "lost";
  if (t.includes("trouv")) return "found";
  if (t.includes("bless")) return "injured";
  if (t.includes("errant")) return "stray";
  if (t.includes("maltrait")) return "abuse";
  if (t.includes("mort") || t.includes("décéd")) return "deceased";
  return "other";
}
function wording(type: string | null) {
  switch (kind(type)) {
    case "lost": return { title: "ALERTE DISPARITION", subtitle: "AIDONS-LE À RETROUVER SON FOYER !", advice: "SI VOUS L’APERCEVEZ, NE LE COUREZ PAS APRÈS !", detail: "Prenez une photo, notez le lieu et contactez le déclarant depuis la fiche.", date: "DISPARU LE" };
    case "found": return { title: "ANIMAL TROUVÉ", subtitle: "AIDONS-LE À RETROUVER SA FAMILLE !", advice: "VOUS LE RECONNAISSEZ ?", detail: "Consultez la fiche et transmettez toute information utile.", date: "TROUVÉ LE" };
    case "injured": return { title: "ANIMAL BLESSÉ", subtitle: "UNE AIDE RAPIDE PEUT TOUT CHANGER", advice: "PRUDENCE ET SÉCURITÉ", detail: "N’intervenez pas au risque de vous blesser. Contactez un professionnel.", date: "SIGNALÉ LE" };
    case "stray": return { title: "ANIMAL ERRANT", subtitle: "ENSEMBLE, RESTONS VIGILANTS", advice: "VOUS AVEZ DES INFORMATIONS ?", detail: "Notez le secteur et signalez toute observation depuis la fiche.", date: "SIGNALÉ LE" };
    case "abuse": return { title: "SIGNALEMENT ANIMAL", subtitle: "PROTÉGEONS LES ANIMAUX", advice: "NE VOUS METTEZ PAS EN DANGER", detail: "Transmettez les informations aux intervenants compétents.", date: "SIGNALÉ LE" };
    case "deceased": return { title: "ANIMAL DÉCÉDÉ", subtitle: "AIDONS À INFORMER SA FAMILLE", advice: "VOUS LE RECONNAISSEZ ?", detail: "Consultez la fiche et contactez les personnes concernées.", date: "SIGNALÉ LE" };
    default: return { title: "ALERTE ANIMALE", subtitle: "LA COMMUNAUTÉ SE MOBILISE", advice: "UNE INFORMATION UTILE ?", detail: "Consultez la fiche du signalement pour en savoir plus.", date: "SIGNALÉ LE" };
  }
}
function dateLabel(v: string | null | undefined) {
  if (!v) return "Non précisée";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "Non précisée";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Pacific/Tahiti" }).format(d);
}
function bytesToDataUri(bytes: Uint8Array, mime: string) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    const chunk = bytes.subarray(i, i + 8192);
    for (let j = 0; j < chunk.length; j++) binary += String.fromCharCode(chunk[j]);
  }
  return `data:${mime};base64,${btoa(binary)}`;
}
async function safeImage(url: string | null | undefined, allowedHost: string): Promise<string | null> {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || u.hostname !== allowedHost) return null;
    const response = await fetch(u.toString(), { cache: "no-store" });
    if (!response.ok) return null;
    const mime = (response.headers.get("content-type") || "").split(";")[0].toLowerCase();
    if (!["image/png", "image/jpeg", "image/webp"].includes(mime)) return null;
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength > 8 * 1024 * 1024) return null;
    return bytesToDataUri(buffer, mime);
  } catch { return null; }
}
function detailRow(label: string, value: string, size = 29) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginBottom: 16, width: "100%" }}>
      <div style={{ display: "flex", fontSize: 19, fontWeight: 800, color: RED }}>{label}</div>
      <div style={{ display: "flex", fontSize: size, fontWeight: 800, color: "#152b29", lineHeight: 1.13, overflowWrap: "break-word" }}>{value}</div>
    </div>
  );
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return new Response("Identifiant invalide", { status: 400 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return new Response("Configuration Supabase manquante", { status: 500 });
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.from("signalements")
      .select("id,type_signalement,animal_type,animal_name,sex,age_label,breed,color,collar_color,distinctive_features,city,island,disappearance_at,found_at,created_at")
      .eq("id", id).maybeSingle();
    if (error || !data) return new Response("Signalement introuvable", { status: 404 });
    const item = data as Signalement;
    const { data: media } = await supabase.from("signalement_medias").select("file_url,file_type").eq("signalement_id", id).limit(30);
    const mediaImage = ((media || []) as Media[]).find(m => !clean(m.file_type).toLowerCase().startsWith("video/") && !!m.file_url && /\/storage\/v1\/object\//.test(m.file_url));
    const photo = await safeImage(mediaImage?.file_url, new URL(url).hostname);
    const origin = new URL(request.url).origin;
    const officialUrl = `https://www.taui-te-ora.com/signalement/public/${id}`;
    const qrSvg = await QRCode.toString(officialUrl, { type: "svg", errorCorrectionLevel: "H", margin: 2, width: 270, color: { dark: "#082a27", light: "#ffffff" } });
    const qr = `data:image/svg+xml;base64,${btoa(qrSvg)}`;
    let logo: string | null = null;
    try {
      const res = await fetch(`${origin}/taui-logo-officiel.png`, { cache: "no-store" });
      if (res.ok && (res.headers.get("content-type") || "").startsWith("image/png")) {
        const bytes = new Uint8Array(await res.arrayBuffer());
        if (bytes.length <= 4 * 1024 * 1024) logo = bytesToDataUri(bytes, "image/png");
      }
    } catch { /* Le titre textuel reste visible si le logo est absent. */ }
    const w = wording(item.type_signalement);
    const lost = kind(item.type_signalement) === "lost";
    const name = shorten(clean(item.animal_name) || "ANIMAL SIGNALÉ", 23).toUpperCase();
    const location = [clean(item.city), clean(item.island)].filter(Boolean).join(" • ") || "Non précisé";
    const species = clean(item.animal_type) || "Non précisée";
    const appearance = [clean(item.breed), clean(item.sex), clean(item.age_label), clean(item.color), clean(item.collar_color) ? `Collier : ${clean(item.collar_color)}` : ""].filter(Boolean).join(" • ");
    const eventDate = dateLabel((lost ? item.disappearance_at : item.found_at) || item.created_at);
    const features = clean(item.distinctive_features);
    return new ImageResponse(
      <div style={{ display: "flex", flexDirection: "column", width: 1200, height: 1200, backgroundColor: "#fff", fontFamily: "Arial, sans-serif", overflow: "hidden" }}>
        <div style={{ display: "flex", height: 182, backgroundColor: RED, justifyContent: "space-between", alignItems: "center", paddingLeft: 42 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 840 }}>
            <div style={{ display: "flex", fontSize: 67, fontWeight: 900, color: YELLOW, lineHeight: 1.05 }}>{w.title}</div>
            <div style={{ display: "flex", marginTop: 10, fontSize: 27, fontWeight: 800, color: "white" }}>{w.subtitle}</div>
          </div>
          <div style={{ display: "flex", width: 290, height: 182, alignItems: "center", justifyContent: "center", backgroundColor: "white", padding: 10 }}>
            {logo ? <img src={logo} width={165} height={165} alt="Logo TAUI TE ORA" style={{ objectFit: "contain" }} /> : <div style={{ display: "flex", fontSize: 32, fontWeight: 900, color: GREEN, textAlign: "center" }}>TAUI TE ORA</div>}
          </div>
        </div>
        <div style={{ display: "flex", height: 155, backgroundColor: RED, borderTop: "8px solid white", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <div style={{ display: "flex", color: "white", fontWeight: 900, fontSize: name.length > 15 ? 68 : 95, lineHeight: 1 }}>{name}</div>
          <div style={{ display: "flex", color: "white", fontWeight: 800, fontSize: 26, marginTop: 6 }}>{clean(item.type_signalement).toUpperCase() || "SIGNALEMENT"}</div>
        </div>
        <div style={{ display: "flex", height: 605, padding: "20px 26px", backgroundColor: "#fffaf5", gap: 23 }}>
          <div style={{ display: "flex", width: 540, height: 560, backgroundColor: "#e5efec", borderRadius: 18, overflow: "hidden", border: "5px solid white", alignItems: "center", justifyContent: "center" }}>
            {photo ? <img src={photo} width={540} height={560} alt="" style={{ objectFit: "cover", width: "100%", height: "100%" }} /> : <div style={{ display: "flex", color: GREEN, fontSize: 28, fontWeight: 800 }}>PHOTO NON DISPONIBLE</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", width: 580, justifyContent: "center" }}>
            {detailRow("ESPÈCE", species)}
            {detailRow("SECTEUR", shorten(location, 68))}
            {detailRow(w.date, eventDate)}
            {appearance ? detailRow("DESCRIPTION", shorten(appearance, 115), 25) : null}
            {features ? detailRow("SIGNES PARTICULIERS", shorten(features, 150), 23) : null}
            <div style={{ display: "flex", flexDirection: "column", backgroundColor: "#fff0ed", border: `2px solid ${RED}`, borderRadius: 18, padding: "13px 17px" }}>
              <div style={{ display: "flex", color: RED, fontSize: 23, fontWeight: 900 }}>{w.advice}</div>
              <div style={{ display: "flex", color: "#142b27", fontSize: 21, marginTop: 6 }}>{w.detail}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", height: 90, alignItems: "center", justifyContent: "center", backgroundColor: YELLOW }}>
          <div style={{ display: "flex", fontSize: 39, color: "#111", fontWeight: 900 }}>PARTAGEZ POUR L’AIDER !</div>
        </div>
        <div style={{ display: "flex", height: 168, backgroundColor: GREEN, padding: "13px 30px", alignItems: "center", gap: 23 }}>
          <div style={{ display: "flex", width: 142, height: 142, backgroundColor: "white", borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
            <img src={qr} width={136} height={136} alt="QR code vers la fiche du signalement" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 9 }}>
            <div style={{ display: "flex", color: "white", fontSize: 28, fontWeight: 900 }}>SCANNEZ POUR VOIR LA FICHE</div>
            <div style={{ display: "flex", color: YELLOW, fontSize: 31, fontWeight: 900 }}>www.taui-te-ora.com</div>
            <div style={{ display: "flex", color: "white", fontSize: 20 }}>Photos, informations et contact depuis la fiche publique.</div>
          </div>
          <div style={{ display: "flex", width: 190, color: "white", fontSize: 22, fontWeight: 800, textAlign: "center" }}>TAUI TE ORA<br />by Les Veilleurs de Kali</div>
        </div>
      </div>,
      { width: 1200, height: 1200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erreur génération affiche signalement", error);
    return new Response("Impossible de générer l’affiche", { status: 500 });
  }
}
