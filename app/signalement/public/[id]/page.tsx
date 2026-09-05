import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.taui-te-ora.com";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function getSignalement(id: string) {
  const supabase = getAdmin();
  if (!supabase) return null;
  const { data } = await supabase
    .from("signalements")
    .select("id,type_signalement,animal_type,animal_name,sex,age_label,color,breed,island,city,situation,description,status,disappearance_at,found_at,created_at")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getSignalement(id);
  if (!item) return { title: "Signalement | TAUI TE ORA" };
  const type = clean(item.type_signalement) || "Signalement animal";
  const name = clean(item.animal_name);
  const place = [clean(item.city), clean(item.island)].filter(Boolean).join(" • ");
  const title = `${type}${name ? ` — ${name}` : ""} | TAUI TE ORA`;
  const description = `${type}${name ? ` : ${name}` : ""}${place ? ` à ${place}` : ""}. Consultez et partagez ce signalement TAUI TE ORA.`;
  const image = `${SITE_URL}/api/share-image/signalement/${encodeURIComponent(id)}`;
  const url = `${SITE_URL}/signalement/public/${encodeURIComponent(id)}`;
  return {
    title,
    description,
    openGraph: { title, description, url, type: "website", images: [{ url: image, width: 1200, height: 1200, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function PublicSignalementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getSignalement(id);
  if (!item) {
    return <main className="min-h-screen bg-[#f8f4ec] p-8"><div className="mx-auto max-w-xl rounded-[28px] bg-white p-8 text-center shadow"><h1 className="text-2xl font-black text-red-600">Signalement indisponible</h1></div></main>;
  }
  const supabase = getAdmin();
  const { data: medias } = supabase ? await supabase.from("signalement_medias").select("file_url,file_type").eq("signalement_id", id) : { data: [] as any[] };
  const images = (medias || []).filter((m: any) => String(m.file_type || "").startsWith("image/"));
  const type = clean(item.type_signalement) || "Signalement";
  const name = clean(item.animal_name) || "Nom inconnu";
  const publicUrl = `${SITE_URL}/signalement/public/${encodeURIComponent(id)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`🚨 ${type} — ${name}\n${publicUrl}`)}`;

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-4 py-8 pb-24">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[30px] bg-white p-6 shadow-lg">
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">🚨 ALERTE TAUI TE ORA</span>
          <h1 className="mt-4 text-3xl font-black text-[#064b42]">{type}</h1>
          <p className="mt-2 text-lg text-[#6f5a47]">{clean(item.animal_type) || "Animal"} · {name}</p>
          <p className="mt-3 font-black text-[#b58b5b]">📍 {clean(item.city) || "Commune inconnue"} - {clean(item.island) || "Île inconnue"}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={facebook} target="_blank" rel="noreferrer" className="rounded-full bg-[#1877F2] px-5 py-3 font-black text-white">Facebook</a>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-full bg-green-600 px-5 py-3 font-black text-white">WhatsApp</a>
          </div>
        </section>

        {images.length > 0 && <section className="mt-6 grid gap-4 sm:grid-cols-2">{images.map((m: any, i: number) => <img key={`${m.file_url}-${i}`} src={m.file_url} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full rounded-[24px] object-cover shadow" />)}</section>}

        <section className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-[30px] bg-white p-6 shadow"><h2 className="text-xl font-black text-[#064b42]">Informations</h2><div className="mt-4 space-y-3 text-[#6f5a47]"><p><strong>Sexe :</strong> {clean(item.sex) || "Non renseigné"}</p><p><strong>Âge :</strong> {clean(item.age_label) || "Non renseigné"}</p><p><strong>Race :</strong> {clean(item.breed) || "Non renseigné"}</p><p><strong>Couleur :</strong> {clean(item.color) || "Non renseigné"}</p></div></div>
          <div className="rounded-[30px] bg-white p-6 shadow"><h2 className="text-xl font-black text-[#064b42]">Situation</h2><p className="mt-4 whitespace-pre-wrap text-[#6f5a47]">{clean(item.situation) || clean(item.description) || "Aucune précision supplémentaire."}</p></div>
        </section>

        <p className="mt-8 text-center font-black text-[#064b42]">TAUI TE ORA · On ne sauvera pas le monde, mais on sauvera le leur. 🐾</p>
      </div>
    </main>
  );
}
