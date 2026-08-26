"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 8 * 1024 * 1024;

const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const SAFE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function validateFile(file: File) {
  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    throw new Error(
      `Le fichier "${file.name}" n'est pas autorisé. Formats acceptés : JPG, PNG et WEBP.`
    );
  }

  if (file.size <= 0) {
    throw new Error(`Le fichier "${file.name}" est vide.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `Le fichier "${file.name}" dépasse la taille maximale de 8 Mo.`
    );
  }
}

function buildSafeFilePath(signalementId: string, file: File) {
  const extension = SAFE_EXTENSIONS[file.type];

  if (!extension) {
    throw new Error("Type de fichier non autorisé.");
  }

  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${signalementId}/${randomId}.${extension}`;
}


export default function SignalementPage() {
  const router = useRouter();

  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    type_signalement: "",
    animal_type: "",
    animal_name: "",
    sex: "",
    age_label: "",
    color: "",
    breed: "",
    island: "",
    city: "",
    address: "",
    address_details: "",
    latitude: "",
    longitude: "",
    disappearance_date: "",
    disappearance_time: "",
    disappearance_time_unknown: false,
    found_date: "",
    found_time: "",
    found_time_unknown: false,
    situation: "",
    description: "",
    reporter_name: "",
    reporter_phone: "",
    reporter_email: "",
    anonymous: false,
    wants_contact: true,
  });

  const updateField = useCallback((name: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setPosition = useCallback((lat: number, lng: number) => {
    updateField("latitude", String(lat));
    updateField("longitude", String(lng));

    const L = leafletRef.current;
    if (!L || !leafletMap.current) return;

    const icon = L.divIcon({
      className: "",
      html: `<div style="font-size:34px;">📍</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], {
        draggable: true,
        icon,
      }).addTo(leafletMap.current);

      markerRef.current.on("dragend", () => {
        const pos = markerRef.current?.getLatLng();
        if (!pos) return;
        updateField("latitude", String(pos.lat));
        updateField("longitude", String(pos.lng));
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

    leafletMap.current.setView([lat, lng], 16);
  }, [updateField]);

  useEffect(() => {
    async function initMap() {
      if (!mapRef.current || leafletMap.current) return;

      const L = await import("leaflet");
      leafletRef.current = L;

      const map = L.map(mapRef.current).setView([-17.5516, -149.5585], 10);
      leafletMap.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      map.on("click", (e: any) => {
        setPosition(e.latlng.lat, e.latlng.lng);
      });
    }

    initMap();
  }, [setPosition]);

  function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const selectedFiles = Array.from(event.target.files || []);

      if (selectedFiles.length > MAX_FILES) {
        throw new Error(
          `Vous pouvez ajouter au maximum ${MAX_FILES} photos.`
        );
      }

      selectedFiles.forEach(validateFile);
      setFiles(selectedFiles);
    } catch (error: any) {
      event.target.value = "";
      setFiles([]);
      alert(error?.message || "Fichier non autorisé.");
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas disponible.");
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPosition(position.coords.latitude, position.coords.longitude);
        setGpsLoading(false);
      },
      () => {
        alert("Impossible de récupérer votre position.");
        setGpsLoading(false);
      }
    );
  }

  async function sendSignalement() {
    try {
      setLoading(true);

      if (
        !form.type_signalement ||
        !form.animal_type ||
        !form.island ||
        !form.city
      ) {
        alert(
          "Merci de remplir le type de signalement, l'animal, l'île et la commune."
        );
        return;
      }

      if (form.type_signalement === "Animal perdu" && !form.disappearance_date) {
        alert("Merci d'indiquer la date approximative de disparition.");
        return;
      }

      if (form.type_signalement === "Animal trouvé" && !form.found_date) {
        alert("Merci d'indiquer la date approximative de découverte.");
        return;
      }

      if (files.length > MAX_FILES) {
        throw new Error(
          `Vous pouvez ajouter au maximum ${MAX_FILES} photos.`
        );
      }

      files.forEach(validateFile);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: signalement, error } = await supabase
        .from("signalements")
        .insert({
          user_id: user?.id || null,
          type_signalement: form.type_signalement,
          animal_type: form.animal_type,
          animal_name: form.animal_name,
          sex: form.sex,
          age_label: form.age_label,
          color: form.color,
          breed: form.breed,
          island: form.island,
          city: form.city,
          address: form.address,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
          disappearance_at:
            form.type_signalement === "Animal perdu" && form.disappearance_date
              ? new Date(`${form.disappearance_date}T${form.disappearance_time_unknown || !form.disappearance_time ? "12:00" : form.disappearance_time}:00`).toISOString()
              : null,
          found_at:
            form.type_signalement === "Animal trouvé" && form.found_date
              ? new Date(`${form.found_date}T${form.found_time_unknown || !form.found_time ? "12:00" : form.found_time}:00`).toISOString()
              : null,
          situation: form.situation,
          description: `${form.description}\n\nPrécisions adresse : ${form.address_details}`,
          reporter_name: form.anonymous ? "" : form.reporter_name,
          reporter_phone: form.anonymous ? "" : form.reporter_phone,
          reporter_email: form.anonymous ? "" : form.reporter_email,
          anonymous: form.anonymous,
          wants_contact: form.wants_contact,
          status: "nouveau",
        })
        .select("id")
        .single();

      if (error) throw error;

      if (files.length > 0 && signalement?.id) {
        for (const file of files) {
          validateFile(file);

          const filePath =
            buildSafeFilePath(signalement.id, file);

          const { error: uploadError } = await supabase.storage
            .from("signalements")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type,
            });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from("signalements")
            .getPublicUrl(filePath);

          const { error: mediaError } = await supabase
            .from("signalement_medias")
            .insert({
              signalement_id: signalement.id,
              file_url: publicUrlData.publicUrl,
              file_type: file.type,
              file_name: file.name,
            });

          if (mediaError) throw mediaError;
        }
      }

      alert("Signalement envoyé avec succès.");
      router.push("/");
    } catch (error: any) {
      alert(error.message || "Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-5 pb-52 pt-20 md:pb-10 md:pt-20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h1 className="text-3xl font-black text-[#064b42] sm:text-4xl">
            🚨 Signaler un animal
          </h1>
        </div>

        <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-black text-[#064b42]">
            Informations générales
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <Select
              label="Type de signalement"
              value={form.type_signalement}
              onChange={(v) => updateField("type_signalement", v)}
              options={[
                "Animal errant",
                "Animal perdu",
                "Animal trouvé",
                "Animal blessé",
                "Animal maltraité",
                "Animal décédé",
                "Autre",
              ]}
            />

            <Select
              label="Type d'animal"
              value={form.animal_type}
              onChange={(v) => updateField("animal_type", v)}
              options={["Chien", "Chat", "Oiseau", "Autre"]}
            />

            <Input
              label="Nom si connu"
              value={form.animal_name}
              onChange={(v) => updateField("animal_name", v)}
            />

            <Select
              label="Sexe"
              value={form.sex}
              onChange={(v) => updateField("sex", v)}
              options={["Inconnu", "Mâle", "Femelle"]}
            />

            <Input
              label="Âge estimé"
              value={form.age_label}
              onChange={(v) => updateField("age_label", v)}
            />

            <Input
              label="Couleur"
              value={form.color}
              onChange={(v) => updateField("color", v)}
            />

            <Input
              label="Race"
              value={form.breed}
              onChange={(v) => updateField("breed", v)}
            />
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <div className="mb-6 flex justify-between gap-4">
            <h2 className="text-2xl font-black text-[#064b42]">
              📍 Localisation
            </h2>

            <button
              onClick={useMyLocation}
              disabled={gpsLoading}
              className="rounded-full bg-[#064b42] px-6 py-3 font-bold text-white"
            >
              {gpsLoading ? "Localisation..." : "📍 Utiliser ma position"}
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-5">
              <Input
                label="Île"
                value={form.island}
                onChange={(v) => updateField("island", v)}
              />

              <Input
                label="Commune"
                value={form.city}
                onChange={(v) => updateField("city", v)}
              />

              <Input
                label="Adresse ou repère"
                value={form.address}
                onChange={(v) => updateField("address", v)}
              />

              <Textarea
                label="Informations complémentaires"
                value={form.address_details}
                onChange={(v) => updateField("address_details", v)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Latitude"
                  value={form.latitude}
                  onChange={(v) => updateField("latitude", v)}
                />

                <Input
                  label="Longitude"
                  value={form.longitude}
                  onChange={(v) => updateField("longitude", v)}
                />
              </div>
            </div>

            <div
              ref={mapRef}
              className="h-[500px] overflow-hidden rounded-[28px] border shadow"
            />
          </div>
        </section>

        {form.type_signalement === "Animal perdu" && (
          <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-lg">
            <h2 className="mb-2 text-2xl font-black text-[#064b42]">🕒 Disparition</h2>
            <p className="mb-6 text-sm text-[#6f5a47]">
              Indiquez le moment où l&apos;animal a été vu pour la dernière fois. Une heure approximative suffit.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-bold text-[#064b42]">Date de disparition</label>
                <input type="date" value={form.disappearance_date}
                  onChange={(e) => updateField("disappearance_date", e.target.value)}
                  className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block font-bold text-[#064b42]">Heure approximative</label>
                <input type="time" value={form.disappearance_time}
                  disabled={form.disappearance_time_unknown}
                  onChange={(e) => updateField("disappearance_time", e.target.value)}
                  className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 disabled:opacity-50" />
              </div>
            </div>
            <label className="mt-5 flex items-center gap-3 font-semibold text-[#064b42]">
              <input type="checkbox" checked={form.disappearance_time_unknown}
                onChange={(e) => updateField("disappearance_time_unknown", e.target.checked)} />
              Heure inconnue
            </label>
            <div className="mt-5 rounded-[22px] bg-[#faf7f2] p-4 text-sm text-[#6f5a47]">
              Le point GPS placé sur la carte ci-dessus correspond au <strong>dernier lieu connu de disparition</strong>.
            </div>
          </section>
        )}

        {form.type_signalement === "Animal trouvé" && (
          <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-lg">
            <h2 className="mb-2 text-2xl font-black text-[#064b42]">
              🕒 Découverte de l&apos;animal
            </h2>
            <p className="mb-6 text-sm text-[#6f5a47]">
              Indiquez le moment où l&apos;animal a été découvert. Une heure approximative suffit.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-bold text-[#064b42]">Date de découverte</label>
                <input type="date" value={form.found_date}
                  onChange={(e) => updateField("found_date", e.target.value)}
                  className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block font-bold text-[#064b42]">Heure approximative</label>
                <input type="time" value={form.found_time}
                  disabled={form.found_time_unknown}
                  onChange={(e) => updateField("found_time", e.target.value)}
                  className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 disabled:opacity-50" />
              </div>
            </div>
            <label className="mt-5 flex items-center gap-3 font-semibold text-[#064b42]">
              <input type="checkbox" checked={form.found_time_unknown}
                onChange={(e) => updateField("found_time_unknown", e.target.checked)} />
              Heure inconnue
            </label>
            <div className="mt-5 rounded-[22px] bg-[#faf7f2] p-4 text-sm text-[#6f5a47]">
              Le point GPS placé sur la carte ci-dessus sera utilisé comme
              <strong> lieu de découverte de l&apos;animal</strong>.
            </div>
          </section>
        )}

        <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-black text-[#064b42]">
            État de l'animal
          </h2>

          <Textarea
            label="Situation"
            value={form.situation}
            onChange={(v) => updateField("situation", v)}
          />

          <div className="mt-5">
            <Textarea
              label="Description complète"
              value={form.description}
              onChange={(v) => updateField("description", v)}
            />
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-black text-[#064b42]">
            📸 Photos
          </h2>

          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFilesChange}
            className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3"
          />

          <p className="mt-3 text-sm text-gray-500">
            Vous pouvez ajouter jusqu'à 5 photos (JPG, PNG ou WEBP),
            8 Mo maximum par photo, pour aider les associations à identifier l'animal.
          </p>

          {files.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="rounded-2xl border border-[#eadfce] bg-[#faf7f2] p-4"
                >
                  <p className="break-all text-sm font-semibold text-[#064b42]">
                    {file.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} Mo
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-black text-[#064b42]">
            Vos coordonnées
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Nom"
              value={form.reporter_name}
              onChange={(v) => updateField("reporter_name", v)}
            />

            <Input
              label="Téléphone"
              value={form.reporter_phone}
              onChange={(v) => updateField("reporter_phone", v)}
            />

            <Input
              label="Email"
              value={form.reporter_email}
              onChange={(v) => updateField("reporter_email", v)}
            />
          </div>

          <div className="mt-6 space-y-3">
            <label className="flex gap-3 font-semibold">
              <input
                type="checkbox"
                checked={form.wants_contact}
                onChange={(e) =>
                  updateField("wants_contact", e.target.checked)
                }
              />
              Je souhaite être recontacté
            </label>

            <label className="flex gap-3 font-semibold">
              <input
                type="checkbox"
                checked={form.anonymous}
                onChange={(e) => updateField("anonymous", e.target.checked)}
              />
              Je souhaite rester anonyme
            </label>
          </div>
        </section>

        <div className="mt-8 flex gap-4">
          <button
            onClick={sendSignalement}
            disabled={loading}
            className="rounded-full bg-red-600 px-8 py-4 text-lg font-black text-white"
          >
            {loading ? "Envoi..." : "🚨 Envoyer le signalement"}
          </button>

          <button
            onClick={() => router.push("/")}
            className="rounded-full bg-white px-8 py-4 font-bold text-[#064b42] shadow"
          >
            Annuler
          </button>
        </div>
      </div>
    </main>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function Input({ label, value, onChange }: InputProps) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3"
      />
    </div>
  );
}

type SelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3"
      >
        <option value="">Sélectionner</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

type TextareaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function Textarea({ label, value, onChange }: TextareaProps) {
  return (
    <div>
      <label className="mb-2 block font-bold text-[#064b42]">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3"
      />
    </div>
  );
}