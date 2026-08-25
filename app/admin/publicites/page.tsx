"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Edit3,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  MousePointerClick,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

type Ad = {
  id: string;
  advertiser_name: string;
  title: string;
  description: string | null;
  image_url: string | null;
  logo_url: string | null;
  button_text: string | null;
  target_url: string | null;
  placement: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  priority: number;
  impressions: number;
  clicks: number;
  created_at?: string | null;
  updated_at?: string | null;
};

type AdForm = {
  advertiser_name: string;
  title: string;
  description: string;
  image_url: string;
  logo_url: string;
  button_text: string;
  target_url: string;
  placement: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  priority: string;
};

const emptyForm: AdForm = {
  advertiser_name: "",
  title: "",
  description: "",
  image_url: "",
  logo_url: "",
  button_text: "Découvrir",
  target_url: "",
  placement: "swipe",
  is_active: true,
  start_date: "",
  end_date: "",
  priority: "0",
};

const placements = [
  {
    value: "swipe",
    label: "Swipe Card",
  },
  {
    value: "veterinaires",
    label: "Vétérinaires",
  },
  {
    value: "alimentation",
    label: "Alimentation",
  },
  {
    value: "toilettage",
    label: "Toilettage",
  },
  {
    value: "education",
    label: "Éducation",
  },
  {
    value: "gardiennage",
    label: "Gardiennage",
  },
];

export default function AdminPublicitesPage() {
  const router = useRouter();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<AdForm>(emptyForm);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void initialize();
  }, []);

  async function initialize() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login?redirect=/admin/publicites");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const role = String(profile?.role || "")
        .trim()
        .toLowerCase();

      if (role !== "admin") {
        router.replace("/");
        return;
      }

      await loadAds();
    } catch (error: any) {
      console.error("Erreur administration publicités :", error);

      alert(
        error?.message ||
          "Impossible de charger la gestion des publicités."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadAds() {
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .order("priority", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    setAds((data || []) as Ad[]);
  }

  function updateField<K extends keyof AdForm>(
    field: K,
    value: AdForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openEditForm(ad: Ad) {
    setEditingId(ad.id);

    setForm({
      advertiser_name: ad.advertiser_name || "",
      title: ad.title || "",
      description: ad.description || "",
      image_url: ad.image_url || "",
      logo_url: ad.logo_url || "",
      button_text: ad.button_text || "Découvrir",
      target_url: ad.target_url || "",
      placement: ad.placement || "swipe",
      is_active: Boolean(ad.is_active),
      start_date: toDateTimeLocal(ad.start_date),
      end_date: toDateTimeLocal(ad.end_date),
      priority: String(ad.priority ?? 0),
    });

    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveAd() {
    if (saving) {
      return;
    }

    if (!form.advertiser_name.trim()) {
      alert("Le nom de l'annonceur est obligatoire.");
      return;
    }

    if (!form.title.trim()) {
      alert("Le titre de la publicité est obligatoire.");
      return;
    }

    if (!form.placement) {
      alert("Choisis un emplacement.");
      return;
    }

    if (
      form.start_date &&
      form.end_date &&
      new Date(form.end_date).getTime() <
        new Date(form.start_date).getTime()
    ) {
      alert("La date de fin doit être après la date de début.");
      return;
    }

    try {
      setSaving(true);

      const priorityNumber = Number.parseInt(form.priority || "0", 10);

      const payload = {
        advertiser_name: form.advertiser_name.trim(),
        title: form.title.trim(),

        description:
          form.description.trim() || null,

        image_url:
          form.image_url.trim() || null,

        logo_url:
          form.logo_url.trim() || null,

        button_text:
          form.button_text.trim() || "Découvrir",

        target_url:
          form.target_url.trim() || null,

        placement: form.placement,

        is_active: form.is_active,

        start_date:
          form.start_date
            ? new Date(form.start_date).toISOString()
            : null,

        end_date:
          form.end_date
            ? new Date(form.end_date).toISOString()
            : null,

        priority:
          Number.isFinite(priorityNumber)
            ? priorityNumber
            : 0,

        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from("ads")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          throw error;
        }

        alert("Publicité modifiée.");
      } else {
        const { error } = await supabase
          .from("ads")
          .insert(payload);

        if (error) {
          throw error;
        }

        alert("Publicité ajoutée.");
      }

      await loadAds();
      closeForm();
    } catch (error: any) {
      console.error("Erreur sauvegarde publicité :", error);

      alert(
        error?.message ||
          "Impossible d'enregistrer la publicité."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(ad: Ad) {
    try {
      const { error } = await supabase
        .from("ads")
        .update({
          is_active: !ad.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ad.id);

      if (error) {
        throw error;
      }

      setAds((previous) =>
        previous.map((item) =>
          item.id === ad.id
            ? {
                ...item,
                is_active: !item.is_active,
              }
            : item
        )
      );
    } catch (error: any) {
      console.error("Erreur changement statut publicité :", error);

      alert(
        error?.message ||
          "Impossible de modifier le statut."
      );
    }
  }

  async function deleteAd(ad: Ad) {
    const firstConfirmation = window.confirm(
      `Supprimer la publicité "${ad.title}" de ${ad.advertiser_name} ?`
    );

    if (!firstConfirmation) {
      return;
    }

    const secondConfirmation = window.confirm(
      "Cette suppression est définitive. Confirmer ?"
    );

    if (!secondConfirmation) {
      return;
    }

    try {
      setDeletingId(ad.id);

      const { error } = await supabase
        .from("ads")
        .delete()
        .eq("id", ad.id);

      if (error) {
        throw error;
      }

      setAds((previous) =>
        previous.filter((item) => item.id !== ad.id)
      );
    } catch (error: any) {
      console.error("Erreur suppression publicité :", error);

      alert(
        error?.message ||
          "Impossible de supprimer la publicité."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredAds = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return ads;
    }

    return ads.filter((ad) => {
      const searchable = [
        ad.advertiser_name,
        ad.title,
        ad.description,
        ad.placement,
        ad.target_url,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [ads, search]);

  const activeCount = ads.filter(
    (ad) => ad.is_active
  ).length;

  const totalImpressions = ads.reduce(
    (total, ad) => total + Number(ad.impressions || 0),
    0
  );

  const totalClicks = ads.reduce(
    (total, ad) => total + Number(ad.clicks || 0),
    0
  );

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fbf7ef]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#e2d5c5] border-t-[#064b42]" />

          <p className="mt-4 font-black text-[#064b42]">
            Chargement des publicités...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#fbf7ef] px-4 pb-24 pt-6 sm:px-6">
      <section className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push("/admin/dashboard")
              }
              className="mb-4 flex items-center gap-2 text-sm font-black text-[#6f665f]"
            >
              <ArrowLeft size={18} />
              Retour administration
            </button>

            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#df8995]">
              TAUI TE ORA
            </p>

            <h1 className="mt-1 text-4xl font-black text-[#064b42]">
              Publicités & Partenaires
            </h1>

            <p className="mt-2 max-w-2xl text-[#776b61]">
              Gérez les campagnes partenaires affichées dans
              l'application.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center justify-center gap-2 rounded-full bg-[#064b42] px-7 py-4 font-black text-white shadow-lg"
          >
            <Plus size={20} />
            Ajouter une publicité
          </button>
        </div>

        {/* STATISTIQUES */}

        <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Campagnes"
            value={ads.length}
            icon={<BarChart3 size={24} />}
          />

          <StatCard
            label="Actives"
            value={activeCount}
            icon={<Eye size={24} />}
          />

          <StatCard
            label="Affichages"
            value={totalImpressions}
            icon={<Eye size={24} />}
          />

          <StatCard
            label="Clics"
            value={totalClicks}
            icon={<MousePointerClick size={24} />}
          />
        </div>

        {/* FORMULAIRE */}

        {formOpen && (
          <section className="mt-7 rounded-[30px] bg-white p-5 shadow-xl sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#df8995]">
                  Campagne
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#064b42]">
                  {editingId
                    ? "Modifier la publicité"
                    : "Nouvelle publicité"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5eee6]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Input
                label="Annonceur *"
                value={form.advertiser_name}
                onChange={(value) =>
                  updateField("advertiser_name", value)
                }
                placeholder="Ex : Clinique Vétérinaire..."
              />

              <Input
                label="Titre *"
                value={form.title}
                onChange={(value) =>
                  updateField("title", value)
                }
                placeholder="Ex : Offre spéciale adoption"
              />

              <div className="md:col-span-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Description
                  </span>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="Texte présenté sur la publicité..."
                    className="w-full resize-none rounded-[18px] border border-[#ded4c5] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#064b42]"
                  />
                </label>
              </div>

              <Input
                label="URL de l'image"
                value={form.image_url}
                onChange={(value) =>
                  updateField("image_url", value)
                }
                placeholder="https://..."
              />

              <Input
                label="URL du logo"
                value={form.logo_url}
                onChange={(value) =>
                  updateField("logo_url", value)
                }
                placeholder="https://..."
              />

              <Input
                label="Texte du bouton"
                value={form.button_text}
                onChange={(value) =>
                  updateField("button_text", value)
                }
                placeholder="Découvrir"
              />

              <Input
                label="Lien du bouton"
                value={form.target_url}
                onChange={(value) =>
                  updateField("target_url", value)
                }
                placeholder="https://..."
              />

              <label>
                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  Emplacement
                </span>

                <select
                  value={form.placement}
                  onChange={(event) =>
                    updateField(
                      "placement",
                      event.target.value
                    )
                  }
                  className="w-full rounded-[18px] border border-[#ded4c5] bg-[#fffaf7] px-4 py-3 outline-none"
                >
                  {placements.map((placement) => (
                    <option
                      key={placement.value}
                      value={placement.value}
                    >
                      {placement.label}
                    </option>
                  ))}
                </select>
              </label>

              <Input
                label="Priorité"
                type="number"
                value={form.priority}
                onChange={(value) =>
                  updateField("priority", value)
                }
                placeholder="0"
              />

              <Input
                label="Début de campagne"
                type="datetime-local"
                value={form.start_date}
                onChange={(value) =>
                  updateField("start_date", value)
                }
              />

              <Input
                label="Fin de campagne"
                type="datetime-local"
                value={form.end_date}
                onChange={(value) =>
                  updateField("end_date", value)
                }
              />

              <div className="md:col-span-2">
                <label className="flex cursor-pointer items-center justify-between rounded-[20px] bg-[#f8f4ec] px-5 py-4">
                  <div>
                    <p className="font-black text-[#064b42]">
                      Campagne active
                    </p>

                    <p className="mt-1 text-sm text-[#7a6d63]">
                      Une campagne inactive ne sera pas affichée.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      updateField(
                        "is_active",
                        event.target.checked
                      )
                    }
                    className="h-6 w-6 accent-[#064b42]"
                  />
                </label>
              </div>

              {(form.image_url || form.logo_url) && (
                <div className="md:col-span-2">
                  <p className="mb-3 text-sm font-black text-[#064b42]">
                    Aperçu
                  </p>

                  <AdPreview form={form} />
                </div>
              )}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-full bg-[#f3eee9] px-6 py-3 font-black text-[#645e59]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={saveAd}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-full bg-[#064b42] px-7 py-3 font-black text-white shadow-lg disabled:opacity-60"
              >
                <Save size={18} />

                {saving
                  ? "Enregistrement..."
                  : editingId
                    ? "Enregistrer"
                    : "Créer la publicité"}
              </button>
            </div>
          </section>
        )}

        {/* RECHERCHE */}

        <section className="mt-7 rounded-[24px] bg-white p-4 shadow-md">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher une publicité ou un partenaire..."
              className="w-full rounded-[18px] border border-[#e5d9cf] bg-[#fffaf7] py-3 pl-11 pr-4 outline-none"
            />
          </div>
        </section>

        {/* LISTE */}

        <div className="mt-5 font-black text-[#064b42]">
          {filteredAds.length} campagne
          {filteredAds.length > 1 ? "s" : ""}
        </div>

        {filteredAds.length === 0 ? (
          <section className="mt-5 rounded-[30px] bg-white p-12 text-center shadow-lg">
            <ImageIcon
              size={46}
              className="mx-auto text-[#b6aaa0]"
            />

            <h2 className="mt-4 text-xl font-black text-[#064b42]">
              Aucune publicité
            </h2>

            <p className="mt-2 text-[#776b61]">
              Créez votre première campagne partenaire.
            </p>
          </section>
        ) : (
          <section className="mt-5 grid gap-5 lg:grid-cols-2">
            {filteredAds.map((ad) => (
              <article
                key={ad.id}
                className="overflow-hidden rounded-[28px] bg-white shadow-lg"
              >
                {ad.image_url ? (
                  <div className="relative h-48 bg-[#eee7df]">
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#064b42] shadow">
                      Sponsorisé
                    </div>
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center bg-[#f4eee6]">
                    <ImageIcon
                      size={38}
                      className="text-[#b5aaa0]"
                    />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            ad.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {ad.is_active
                            ? "ACTIVE"
                            : "INACTIVE"}
                        </span>

                        <span className="rounded-full bg-[#e8f4f1] px-3 py-1 text-xs font-black text-[#064b42]">
                          {placementLabel(ad.placement)}
                        </span>
                      </div>

                      <p className="mt-4 text-xs font-black uppercase tracking-wider text-[#df8995]">
                        {ad.advertiser_name}
                      </p>

                      <h2 className="mt-1 text-2xl font-black text-[#064b42]">
                        {ad.title}
                      </h2>
                    </div>

                    {ad.logo_url && (
                      <img
                        src={ad.logo_url}
                        alt={ad.advertiser_name}
                        className="h-14 w-14 shrink-0 rounded-full border bg-white object-contain p-1"
                      />
                    )}
                  </div>

                  {ad.description && (
                    <p className="mt-3 text-sm leading-6 text-[#71665d]">
                      {ad.description}
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <MiniStat
                      label="Priorité"
                      value={ad.priority}
                    />

                    <MiniStat
                      label="Affichages"
                      value={ad.impressions}
                    />

                    <MiniStat
                      label="Clics"
                      value={ad.clicks}
                    />
                  </div>

                  {(ad.start_date || ad.end_date) && (
                    <div className="mt-4 rounded-[18px] bg-[#faf6f0] p-4 text-xs text-[#74695f]">
                      {ad.start_date && (
                        <p>
                          <strong>Début :</strong>{" "}
                          {formatDate(ad.start_date)}
                        </p>
                      )}

                      {ad.end_date && (
                        <p className="mt-1">
                          <strong>Fin :</strong>{" "}
                          {formatDate(ad.end_date)}
                        </p>
                      )}
                    </div>
                  )}

                  {ad.target_url && (
                    <a
                      href={ad.target_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 flex items-center gap-2 text-sm font-black text-[#064b42]"
                    >
                      <ExternalLink size={16} />
                      Tester le lien
                    </a>
                  )}

                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(ad)
                      }
                      className="flex items-center justify-center gap-2 rounded-[16px] bg-[#064b42] px-4 py-3 font-black text-white"
                    >
                      <Edit3 size={17} />
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleActive(ad)
                      }
                      className={`rounded-[16px] px-4 py-3 font-black ${
                        ad.is_active
                          ? "bg-orange-50 text-orange-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {ad.is_active
                        ? "Désactiver"
                        : "Activer"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteAd(ad)
                      }
                      disabled={
                        deletingId === ad.id
                      }
                      className="col-span-2 flex items-center justify-center gap-2 rounded-[16px] bg-red-50 px-4 py-3 font-black text-red-600 disabled:opacity-50 sm:col-span-1"
                    >
                      <Trash2 size={17} />

                      {deletingId === ad.id
                        ? "Suppression..."
                        : "Supprimer"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#064b42]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-[18px] border border-[#ded4c5] bg-[#fffaf7] px-4 py-3 outline-none focus:border-[#064b42]"
      />
    </label>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-md">
      <div className="text-[#df8995]">
        {icon}
      </div>

      <p className="mt-3 text-3xl font-black text-[#064b42]">
        {value}
      </p>

      <p className="mt-1 text-sm font-bold text-[#766b62]">
        {label}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[16px] bg-[#f8f4ec] p-3">
      <p className="text-lg font-black text-[#064b42]">
        {value || 0}
      </p>

      <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-[#8a7d72]">
        {label}
      </p>
    </div>
  );
}

function AdPreview({
  form,
}: {
  form: AdForm;
}) {
  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-[28px] bg-[#064b42] shadow-xl">
      {form.image_url ? (
        <div className="relative h-64">
          <img
            src={form.image_url}
            alt=""
            className="h-full w-full object-cover"
          />

          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-black uppercase text-[#064b42]">
            Sponsorisé
          </span>
        </div>
      ) : (
        <div className="flex h-52 items-center justify-center bg-[#eee7df]">
          <ImageIcon
            size={42}
            className="text-[#aaa097]"
          />
        </div>
      )}

      <div className="p-5 text-white">
        <div className="flex items-center gap-3">
          {form.logo_url && (
            <img
              src={form.logo_url}
              alt=""
              className="h-12 w-12 rounded-full bg-white object-contain p-1"
            />
          )}

          <p className="text-xs font-black uppercase tracking-wider text-white/70">
            {form.advertiser_name ||
              "Partenaire"}
          </p>
        </div>

        <h3 className="mt-3 text-2xl font-black">
          {form.title ||
            "Titre de la publicité"}
        </h3>

        {form.description && (
          <p className="mt-3 text-sm leading-6 text-white/80">
            {form.description}
          </p>
        )}

        <div className="mt-5 rounded-full bg-white px-5 py-3 text-center font-black text-[#064b42]">
          {form.button_text ||
            "Découvrir"}
        </div>

        <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-white/50">
          Sponsorisé
        </p>
      </div>
    </div>
  );
}

function placementLabel(
  placement: string
) {
  return (
    placements.find(
      (item) =>
        item.value === placement
    )?.label || placement
  );
}

function formatDate(
  value: string
) {
  try {
    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}

function toDateTimeLocal(
  value: string | null
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  const offset =
    date.getTimezoneOffset();

  const local =
    new Date(
      date.getTime() -
        offset * 60 * 1000
    );

  return local
    .toISOString()
    .slice(0, 16);
}