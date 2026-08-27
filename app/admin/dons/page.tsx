"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase";

type ImpactItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

type DonationSettings = {
  id: string;
  is_published: boolean;
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  intro_title: string;
  intro_text: string;
  form_title: string;
  form_text: string;
  transparency_title: string;
  transparency_text: string;
  success_title: string;
  success_text: string;
  legal_text: string;
  results_title: string;
  results_subtitle: string;
  adopted_label: string;
  rescued_label: string;
  rescued_dogs_count: number;
  preset_amounts: number[];
  impact_items: ImpactItem[];
};

type DonationPledge = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  amount_xpf: number;
  frequency: "unique" | "mensuelle";
  allocation: string;
  message: string | null;
  is_anonymous: boolean;
  status: "nouvelle" | "contactee" | "confirmee" | "annulee";
  created_at: string;
};

type FinanceEntry = {
  id: string;
  entry_type: "donation" | "depense";
  amount_xpf: number;
  category:
    | "nourriture_divers"
    | "sterilisation_castration"
    | "identification"
    | "soins"
    | null;
  transaction_date: string;
  internal_label: string | null;
  pledge_id: string | null;
  created_at: string;
};

const EMPTY_SETTINGS: DonationSettings = {
  id: "",
  is_published: true,
  hero_badge: "Les Veilleurs de Kali",
  hero_title: "Un don, une seconde chance",
  hero_subtitle:
    "Chaque geste nous aide à protéger, soigner et accompagner les animaux de Polynésie vers une nouvelle vie.",
  intro_title: "Votre aide change leur histoire",
  intro_text:
    "Votre promesse de don permettra de préparer les prochaines actions de protection animale. Aucun paiement n’est effectué aujourd’hui : nous vous recontacterons dès que notre moyen d’encaissement sera disponible.",
  form_title: "Faire une promesse de don",
  form_text: "Choisissez librement le montant et l’action que vous souhaitez soutenir.",
  transparency_title: "Une aide utile et transparente",
  transparency_text:
    "Les futurs dons serviront aux actions de protection animale : soins vétérinaires, stérilisation, vaccination, identification, nourriture, transport et accueil temporaire.",
  success_title: "Merci du fond du cœur",
  success_text:
    "Votre promesse de don est bien enregistrée. Aucun montant n’a été prélevé. Nous vous recontacterons lorsque le moyen de paiement sera disponible.",
  legal_text:
    "Cette démarche enregistre uniquement votre intention. Aucun paiement n’est réalisé et cette promesse n’est pas juridiquement contraignante.",
  results_title: "Dons et résultats",
  results_subtitle: "Des chiffres réels pour suivre ensemble l’impact de la solidarité.",
  adopted_label: "Chiens adoptés via l’application",
  rescued_label: "Chiens sauvés de la rue",
  rescued_dogs_count: 0,
  preset_amounts: [1000, 2500, 5000, 10000],
  impact_items: [
    {
      id: "soins",
      icon: "🩺",
      title: "Soins vétérinaires",
      description: "Consultations, traitements et interventions urgentes.",
    },
    {
      id: "sterilisation",
      icon: "💉",
      title: "Stérilisation et prévention",
      description: "Stérilisation, vaccination et identification.",
    },
    {
      id: "nourriture",
      icon: "🥣",
      title: "Nourriture",
      description: "Repas et besoins essentiels des animaux pris en charge.",
    },
    {
      id: "accueil",
      icon: "🏡",
      title: "Accueil et transport",
      description: "Transport, matériel et soutien aux familles d’accueil.",
    },
  ],
};

const INPUT_CLASS =
  "w-full rounded-xl border border-[#ded5cb] bg-white px-4 py-3 text-sm text-[#2f241c] outline-none focus:border-[#df8995] focus:ring-4 focus:ring-[#df8995]/15";

const EXPENSE_CATEGORIES = [
  ["nourriture_divers", "Nourriture / divers"],
  ["sterilisation_castration", "Stérilisation / castration"],
  ["identification", "Identification"],
  ["soins", "Soins"],
] as const;

export default function AdminDonationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<DonationSettings>(EMPTY_SETTINGS);
  const [amountsText, setAmountsText] = useState("1 000, 2 500, 5 000, 10 000");
  const [pledges, setPledges] = useState<DonationPledge[]>([]);
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"contenu" | "finances" | "promesses">(
    "contenu"
  );
  const [notice, setNotice] = useState("");

  const [entryType, setEntryType] = useState<"donation" | "depense">("donation");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryCategory, setEntryCategory] = useState<FinanceEntry["category"]>(
    "nourriture_divers"
  );
  const [entryDate, setEntryDate] = useState(today());
  const [entryLabel, setEntryLabel] = useState("");
  const [addingEntry, setAddingEntry] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?redirect=/admin/dons");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!["admin", "administrateur"].includes(String(profile?.role || "").toLowerCase())) {
        router.replace("/");
        return;
      }

      const [settingsResult, pledgesResult, financeResult] = await Promise.all([
        supabase
          .from("donation_page_settings")
          .select("*")
          .eq("singleton_key", true)
          .maybeSingle(),
        supabase.from("donation_pledges").select("*").order("created_at", {
          ascending: false,
        }),
        supabase
          .from("donation_financial_entries")
          .select("*")
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (settingsResult.error) throw settingsResult.error;
      if (pledgesResult.error) throw pledgesResult.error;
      if (financeResult.error) throw financeResult.error;

      const normalized = normalizeSettings(settingsResult.data || EMPTY_SETTINGS);
      setSettings(normalized);
      setAmountsText(normalized.preset_amounts.map(formatNumber).join(", "));
      setPledges((pledgesResult.data || []) as DonationPledge[]);
      setFinanceEntries((financeResult.data || []) as FinanceEntry[]);
    } catch (error: unknown) {
      console.error("Erreur administration dons :", error);
      setNotice(`Erreur : ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const financeSummary = useMemo(() => {
    const received = financeEntries
      .filter((item) => item.entry_type === "donation")
      .reduce((sum, item) => sum + Number(item.amount_xpf || 0), 0);
    const spent = financeEntries
      .filter((item) => item.entry_type === "depense")
      .reduce((sum, item) => sum + Number(item.amount_xpf || 0), 0);

    return { received, spent, available: received - spent };
  }, [financeEntries]);

  const pledgeSummary = useMemo(() => {
    const active = pledges.filter((item) => item.status !== "annulee");
    return {
      count: active.length,
      total: active.reduce((sum, item) => sum + Number(item.amount_xpf || 0), 0),
    };
  }, [pledges]);

  async function saveSettings() {
    if (saving) return;

    const amounts = parseAmounts(amountsText);
    if (!amounts.length) {
      setNotice("Ajoute au moins un montant valide entre 100 et 1 000 000 XPF.");
      return;
    }

    try {
      setSaving(true);
      setNotice("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Session administrateur introuvable.");

      const payload = {
        singleton_key: true,
        is_published: settings.is_published,
        hero_badge: settings.hero_badge.trim(),
        hero_title: settings.hero_title.trim(),
        hero_subtitle: settings.hero_subtitle.trim(),
        intro_title: settings.intro_title.trim(),
        intro_text: settings.intro_text.trim(),
        form_title: settings.form_title.trim(),
        form_text: settings.form_text.trim(),
        transparency_title: settings.transparency_title.trim(),
        transparency_text: settings.transparency_text.trim(),
        success_title: settings.success_title.trim(),
        success_text: settings.success_text.trim(),
        legal_text: settings.legal_text.trim(),
        results_title: settings.results_title.trim(),
        results_subtitle: settings.results_subtitle.trim(),
        adopted_label: settings.adopted_label.trim(),
        rescued_label: settings.rescued_label.trim(),
        rescued_dogs_count: Math.max(0, Number(settings.rescued_dogs_count || 0)),
        preset_amounts: amounts,
        impact_items: settings.impact_items,
        updated_by: user.id,
      };

      const { data, error } = await supabase
        .from("donation_page_settings")
        .upsert(payload, { onConflict: "singleton_key" })
        .select("*")
        .single();

      if (error) throw error;

      const normalized = normalizeSettings(data);
      setSettings(normalized);
      setAmountsText(normalized.preset_amounts.map(formatNumber).join(", "));
      setNotice("La page Dons et résultats a bien été enregistrée.");
    } catch (error: unknown) {
      setNotice(`Erreur : ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function addFinanceEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (addingEntry) return;

    const amount = Number(entryAmount.replace(/\s/g, ""));
    if (!Number.isInteger(amount) || amount < 1) {
      setNotice("Indique un montant valide.");
      return;
    }

    try {
      setAddingEntry(true);
      setNotice("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Session administrateur introuvable.");

      const { data, error } = await supabase
        .from("donation_financial_entries")
        .insert({
          entry_type: entryType,
          amount_xpf: amount,
          category: entryType === "depense" ? entryCategory : null,
          transaction_date: entryDate,
          internal_label: entryLabel.trim() || null,
          created_by: user.id,
        })
        .select("*")
        .single();

      if (error) throw error;

      setFinanceEntries((current) =>
        [data as FinanceEntry, ...current].sort(compareFinanceEntries)
      );
      setEntryAmount("");
      setEntryLabel("");
      setNotice(
        entryType === "donation"
          ? "Le don réellement encaissé a été ajouté au compteur public."
          : "La dépense a été ajoutée au compteur public."
      );
    } catch (error: unknown) {
      setNotice(`Erreur : ${getErrorMessage(error)}`);
    } finally {
      setAddingEntry(false);
    }
  }

  async function deleteFinanceEntry(item: FinanceEntry) {
    const label = item.entry_type === "donation" ? "ce don encaissé" : "cette dépense";
    if (!window.confirm(`Supprimer définitivement ${label} de ${formatXpf(item.amount_xpf)} ?`)) {
      return;
    }

    const { error } = await supabase
      .from("donation_financial_entries")
      .delete()
      .eq("id", item.id);

    if (error) {
      setNotice(`Erreur : ${error.message}`);
      return;
    }

    setFinanceEntries((current) => current.filter((entry) => entry.id !== item.id));
    setNotice("L’écriture a été supprimée et les compteurs ont été recalculés.");
  }

  async function markPledgeAsReceived(item: DonationPledge) {
    const alreadyReceived = financeEntries.some(
      (entry) => entry.entry_type === "donation" && entry.pledge_id === item.id
    );

    if (alreadyReceived) {
      setNotice("Cette promesse est déjà liée à un don encaissé.");
      return;
    }

    if (
      !window.confirm(
        `Confirmer l’encaissement réel de ${formatXpf(item.amount_xpf)} ?`
      )
    ) {
      return;
    }

    try {
      setNotice("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Session administrateur introuvable.");

      const { data, error } = await supabase
        .from("donation_financial_entries")
        .insert({
          entry_type: "donation",
          amount_xpf: item.amount_xpf,
          category: null,
          transaction_date: today(),
          internal_label: `Promesse ${item.id.slice(0, 8).toUpperCase()}`,
          pledge_id: item.id,
          created_by: user.id,
        })
        .select("*")
        .single();

      if (error) throw error;

      const { error: statusError } = await supabase
        .from("donation_pledges")
        .update({ status: "confirmee" })
        .eq("id", item.id);

      if (statusError) throw statusError;

      setFinanceEntries((current) =>
        [data as FinanceEntry, ...current].sort(compareFinanceEntries)
      );
      setPledges((current) =>
        current.map((pledge) =>
          pledge.id === item.id ? { ...pledge, status: "confirmee" } : pledge
        )
      );
      setNotice("Le don a été marqué comme réellement encaissé.");
    } catch (error: unknown) {
      setNotice(`Erreur : ${getErrorMessage(error)}`);
    }
  }

  async function changePledgeStatus(id: string, status: DonationPledge["status"]) {
    const { error } = await supabase
      .from("donation_pledges")
      .update({ status })
      .eq("id", id);

    if (error) {
      setNotice(`Erreur : ${error.message}`);
      return;
    }

    setPledges((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item))
    );
  }

  function updateImpact(index: number, field: keyof ImpactItem, value: string) {
    setSettings((current) => ({
      ...current,
      impact_items: current.impact_items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function exportPledges() {
    const rows = pledges.map((item) => [
      formatDate(item.created_at),
      item.full_name,
      item.email,
      item.phone || "",
      item.amount_xpf,
      item.frequency,
      allocationLabel(item.allocation, settings.impact_items),
      pledgeStatusLabel(item.status),
      item.is_anonymous ? "Oui" : "Non",
      item.message || "",
    ]);

    downloadCsv(
      `promesses-dons-${today()}.csv`,
      [
        "Date",
        "Nom",
        "E-mail",
        "Téléphone",
        "Montant XPF",
        "Fréquence",
        "Affectation",
        "Statut",
        "Anonyme",
        "Message",
      ],
      rows
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef]">
        <p className="font-black text-[#064b42]">Chargement des dons…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] px-4 pb-32 pt-6 text-[#2f241c] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[30px] bg-[#064b42] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f6c4cc]">
                Administration
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">Dons et résultats</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                Modifie la page publique, suis les promesses et renseigne uniquement les mouvements financiers réels.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/dons")}
                className="rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-black"
              >
                Voir la page publique
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/dashboard")}
                className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#064b42]"
              >
                Retour au dashboard
              </button>
            </div>
          </div>
        </header>

        {notice && (
          <div className="mt-5 flex items-start justify-between gap-4 rounded-2xl border border-[#e7d9cf] bg-white p-4 text-sm font-bold text-[#5f5045] shadow-sm">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")} aria-label="Fermer">
              ×
            </button>
          </div>
        )}

        <nav className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-white p-2 shadow-sm">
          <TabButton
            active={activeTab === "contenu"}
            onClick={() => setActiveTab("contenu")}
            label="Contenu"
          />
          <TabButton
            active={activeTab === "finances"}
            onClick={() => setActiveTab("finances")}
            label="Dons réels"
          />
          <TabButton
            active={activeTab === "promesses"}
            onClick={() => setActiveTab("promesses")}
            label={`Promesses (${pledges.length})`}
          />
        </nav>

        {activeTab === "contenu" && (
          <div className="mt-6 space-y-6">
            <AdminSection
              title="Publication"
              description="Masquer la page n’efface ni les promesses ni les chiffres."
            >
              <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl bg-[#fbf7ef] p-4">
                <div>
                  <p className="font-black text-[#064b42]">Page publique active</p>
                  <p className="mt-1 text-sm text-[#776c63]">
                    {settings.is_published
                      ? "La page /dons est visible."
                      : "La page affiche un message d’indisponibilité."}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.is_published}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      is_published: event.target.checked,
                    }))
                  }
                  className="h-6 w-6 accent-[#064b42]"
                />
              </label>
            </AdminSection>

            <AdminSection title="En-tête de la page" description="Le grand message visible en premier.">
              <TextField
                label="Petit titre"
                value={settings.hero_badge}
                onChange={(value) => setField(setSettings, "hero_badge", value)}
              />
              <TextField
                label="Titre principal"
                value={settings.hero_title}
                onChange={(value) => setField(setSettings, "hero_title", value)}
              />
              <TextAreaField
                label="Sous-titre"
                value={settings.hero_subtitle}
                onChange={(value) => setField(setSettings, "hero_subtitle", value)}
              />
            </AdminSection>

            <AdminSection title="Présentation" description="Pourquoi les visiteurs peuvent soutenir l’association.">
              <TextField
                label="Titre"
                value={settings.intro_title}
                onChange={(value) => setField(setSettings, "intro_title", value)}
              />
              <TextAreaField
                label="Texte"
                value={settings.intro_text}
                onChange={(value) => setField(setSettings, "intro_text", value)}
              />
            </AdminSection>

            <AdminSection title="Actions financées" description="Ces quatre cartes sont aussi proposées comme affectation de la promesse.">
              <div className="grid gap-4 md:grid-cols-2">
                {settings.impact_items.map((item, index) => (
                  <div key={item.id} className="rounded-2xl border border-[#eadfd8] bg-[#fffdf9] p-4">
                    <div className="grid grid-cols-[80px_1fr] gap-3">
                      <TextField
                        label="Icône"
                        value={item.icon}
                        onChange={(value) => updateImpact(index, "icon", value)}
                      />
                      <TextField
                        label="Titre"
                        value={item.title}
                        onChange={(value) => updateImpact(index, "title", value)}
                      />
                    </div>
                    <div className="mt-3">
                      <TextAreaField
                        label="Description"
                        value={item.description}
                        onChange={(value) => updateImpact(index, "description", value)}
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </AdminSection>

            <AdminSection title="Promesse de don" description="Textes du formulaire et montants proposés.">
              <TextField
                label="Titre du formulaire"
                value={settings.form_title}
                onChange={(value) => setField(setSettings, "form_title", value)}
              />
              <TextAreaField
                label="Introduction du formulaire"
                value={settings.form_text}
                onChange={(value) => setField(setSettings, "form_text", value)}
              />
              <TextField
                label="Montants proposés en XPF, séparés par des virgules"
                value={amountsText}
                onChange={setAmountsText}
                placeholder="1 000, 2 500, 5 000, 10 000"
              />
              <TextAreaField
                label="Mention sous le bouton"
                value={settings.legal_text}
                onChange={(value) => setField(setSettings, "legal_text", value)}
              />
            </AdminSection>

            <AdminSection title="Message de confirmation" description="Affiché après l’enregistrement d’une promesse.">
              <TextField
                label="Titre"
                value={settings.success_title}
                onChange={(value) => setField(setSettings, "success_title", value)}
              />
              <TextAreaField
                label="Texte"
                value={settings.success_text}
                onChange={(value) => setField(setSettings, "success_text", value)}
              />
            </AdminSection>

            <AdminSection title="Transparence" description="Texte placé avant les compteurs publics.">
              <TextField
                label="Titre"
                value={settings.transparency_title}
                onChange={(value) => setField(setSettings, "transparency_title", value)}
              />
              <TextAreaField
                label="Texte"
                value={settings.transparency_text}
                onChange={(value) => setField(setSettings, "transparency_text", value)}
              />
            </AdminSection>

            <AdminSection title="Dons et résultats" description="Les adoptions sont automatiques ; les sauvetages de rue sont saisis ici.">
              <TextField
                label="Titre du compteur"
                value={settings.results_title}
                onChange={(value) => setField(setSettings, "results_title", value)}
              />
              <TextAreaField
                label="Sous-titre"
                value={settings.results_subtitle}
                onChange={(value) => setField(setSettings, "results_subtitle", value)}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Libellé des adoptions"
                  value={settings.adopted_label}
                  onChange={(value) => setField(setSettings, "adopted_label", value)}
                />
                <TextField
                  label="Libellé des sauvetages"
                  value={settings.rescued_label}
                  onChange={(value) => setField(setSettings, "rescued_label", value)}
                />
              </div>
              <div className="max-w-xs">
                <label className="mb-2 block text-sm font-black text-[#43382f]">
                  Nombre de chiens sauvés de la rue
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={settings.rescued_dogs_count}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      rescued_dogs_count: Math.max(0, Number(event.target.value || 0)),
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </AdminSection>

            <div className="sticky bottom-4 z-20 flex justify-end rounded-2xl border border-[#eadfd8] bg-white/95 p-4 shadow-xl backdrop-blur">
              <button
                type="button"
                onClick={() => void saveSettings()}
                disabled={saving}
                className="rounded-full bg-[#df8995] px-7 py-3.5 font-black text-white disabled:opacity-60"
              >
                {saving ? "Enregistrement…" : "Enregistrer tous les changements"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "finances" && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard label="Dons encaissés" value={financeSummary.received} color="pink" />
              <SummaryCard label="Dépenses" value={financeSummary.spent} color="gold" />
              <SummaryCard label="Solde" value={financeSummary.available} color="green" />
            </div>

            <AdminSection
              title="Ajouter une écriture réelle"
              description="Une promesse n’apparaît pas ici tant que le don n’a pas réellement été encaissé."
            >
              <form onSubmit={addFinanceEntry} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <label className="mb-2 block text-sm font-black">Type</label>
                  <select
                    value={entryType}
                    onChange={(event) => setEntryType(event.target.value as "donation" | "depense")}
                    className={INPUT_CLASS}
                  >
                    <option value="donation">Don encaissé</option>
                    <option value="depense">Dépense</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-black">Montant XPF</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={entryAmount}
                    onChange={(event) => setEntryAmount(event.target.value)}
                    className={INPUT_CLASS}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-black">Catégorie</label>
                  <select
                    value={entryCategory || "nourriture_divers"}
                    onChange={(event) => setEntryCategory(event.target.value as FinanceEntry["category"])}
                    className={INPUT_CLASS}
                    disabled={entryType === "donation"}
                  >
                    {EXPENSE_CATEGORIES.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-black">Date réelle</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(event) => setEntryDate(event.target.value)}
                    className={INPUT_CLASS}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-black">Note interne</label>
                  <input
                    value={entryLabel}
                    onChange={(event) => setEntryLabel(event.target.value)}
                    className={INPUT_CLASS}
                    maxLength={250}
                    placeholder="Facultatif"
                  />
                </div>
                <div className="md:col-span-2 xl:col-span-5">
                  <button
                    type="submit"
                    disabled={addingEntry}
                    className="rounded-full bg-[#064b42] px-7 py-3.5 font-black text-white disabled:opacity-60"
                  >
                    {addingEntry ? "Ajout…" : "Ajouter au compteur public"}
                  </button>
                </div>
              </form>
            </AdminSection>

            <AdminSection title="Historique financier" description="Les notes restent privées ; seuls les totaux sont publics.">
              {financeEntries.length === 0 ? (
                <EmptyState text="Aucun don encaissé ni aucune dépense enregistrée." />
              ) : (
                <div className="space-y-3">
                  {financeEntries.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-2xl border border-[#eadfd8] bg-[#fffdf9] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl ${
                            item.entry_type === "donation"
                              ? "bg-[#e7f4ef] text-[#064b42]"
                              : "bg-[#f9e8eb] text-[#b45666]"
                          }`}
                        >
                          {item.entry_type === "donation" ? "+" : "−"}
                        </span>
                        <div>
                          <p className="font-black text-[#2f241c]">
                            {item.entry_type === "donation"
                              ? "Don encaissé"
                              : categoryLabel(item.category)}
                          </p>
                          <p className="mt-1 text-xs text-[#877b72]">
                            {formatDate(item.transaction_date)}
                            {item.internal_label ? ` · ${item.internal_label}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <p
                          className={`text-lg font-black ${
                            item.entry_type === "donation" ? "text-[#087261]" : "text-[#bd5364]"
                          }`}
                        >
                          {item.entry_type === "donation" ? "+ " : "− "}
                          {formatXpf(item.amount_xpf)}
                        </p>
                        <button
                          type="button"
                          onClick={() => void deleteFinanceEntry(item)}
                          className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-700"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminSection>
          </div>
        )}

        {activeTab === "promesses" && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryCard label="Promesses actives" value={pledgeSummary.total} color="pink" />
              <div className="rounded-[24px] bg-[#064b42] p-5 text-white shadow-lg">
                <p className="text-xs font-black uppercase tracking-wider text-white/70">
                  Nombre de promesses
                </p>
                <p className="mt-2 text-3xl font-black">{pledgeSummary.count}</p>
              </div>
            </div>
            <AdminSection
              title="Promesses enregistrées"
              description="Ces montants ne sont jamais ajoutés au compteur des dons encaissés."
              action={
                <button
                  type="button"
                  onClick={exportPledges}
                  disabled={!pledges.length}
                  className="rounded-full bg-[#f3ecdf] px-4 py-2 text-sm font-black text-[#7a5936] disabled:opacity-50"
                >
                  Exporter en CSV
                </button>
              }
            >
              {pledges.length === 0 ? (
                <EmptyState text="Aucune promesse de don pour le moment." />
              ) : (
                <div className="space-y-4">
                  {pledges.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-[#eadfd8] bg-[#fffdf9] p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-[#064b42]">{item.full_name}</h3>
                            {item.is_anonymous && (
                              <span className="rounded-full bg-[#f3ecdf] px-2.5 py-1 text-xs font-black text-[#7a5936]">
                                Anonyme publiquement
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-[#756a61]">
                            {item.email}{item.phone ? ` · ${item.phone}` : ""}
                          </p>
                          <p className="mt-2 text-xs text-[#94887f]">
                            {formatDate(item.created_at)} · Réf. {item.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-right">
                            <p className="text-2xl font-black text-[#df8995]">{formatXpf(item.amount_xpf)}</p>
                            <p className="text-xs text-[#877b72]">
                              {item.frequency === "mensuelle" ? "Chaque mois" : "Une fois"} · {allocationLabel(item.allocation, settings.impact_items)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void markPledgeAsReceived(item)}
                            disabled={financeEntries.some(
                              (entry) =>
                                entry.entry_type === "donation" &&
                                entry.pledge_id === item.id
                            )}
                            className="rounded-full bg-[#064b42] px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-[#b7b0aa]"
                          >
                            {financeEntries.some(
                              (entry) =>
                                entry.entry_type === "donation" &&
                                entry.pledge_id === item.id
                            )
                              ? "Déjà encaissé"
                              : "Marquer encaissé"}
                          </button>
                          <select
                            value={item.status}
                            onChange={(event) =>
                              void changePledgeStatus(
                                item.id,
                                event.target.value as DonationPledge["status"]
                              )
                            }
                            className="rounded-xl border border-[#ded5cb] bg-white px-3 py-2 text-sm font-black text-[#574a40]"
                          >
                            <option value="nouvelle">Nouvelle</option>
                            <option value="contactee">Contactée</option>
                            <option value="confirmee">Confirmée</option>
                            <option value="annulee">Annulée</option>
                          </select>
                        </div>
                      </div>
                      {item.message && (
                        <p className="mt-4 whitespace-pre-line rounded-xl bg-white p-4 text-sm leading-6 text-[#655a51]">
                          {item.message}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </AdminSection>
          </div>
        )}
      </div>
    </main>
  );
}

function AdminSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-white bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#064b42]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#81766d]">{description}</p>
        </div>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-[#43382f]">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT_CLASS}
        placeholder={placeholder}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-[#43382f]">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className={`${INPUT_CLASS} resize-y`}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-3 text-xs font-black sm:text-sm ${
        active ? "bg-[#064b42] text-white" : "text-[#6f665f] hover:bg-[#fbf7ef]"
      }`}
    >
      {label}
    </button>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "pink" | "gold" | "green";
}) {
  const colors = {
    pink: "bg-[#df8995]",
    gold: "bg-[#ad7d39]",
    green: "bg-[#064b42]",
  };

  return (
    <div className={`rounded-[24px] p-5 text-white shadow-lg ${colors[color]}`}>
      <p className="text-xs font-black uppercase tracking-wider text-white/70">{label}</p>
      <p className="mt-2 text-3xl font-black">{formatXpf(value)}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d8cec5] bg-[#fffdf9] p-8 text-center text-sm font-bold text-[#81766d]">
      {text}
    </div>
  );
}

function normalizeSettings(value: unknown): DonationSettings {
  const data = (value || {}) as Record<string, unknown>;
  const rawImpacts = Array.isArray(data.impact_items)
    ? data.impact_items
    : EMPTY_SETTINGS.impact_items;

  return {
    id: String(data.id || ""),
    is_published: data.is_published === undefined ? true : Boolean(data.is_published),
    hero_badge: String(data.hero_badge || EMPTY_SETTINGS.hero_badge),
    hero_title: String(data.hero_title || EMPTY_SETTINGS.hero_title),
    hero_subtitle: String(data.hero_subtitle || EMPTY_SETTINGS.hero_subtitle),
    intro_title: String(data.intro_title || EMPTY_SETTINGS.intro_title),
    intro_text: String(data.intro_text || EMPTY_SETTINGS.intro_text),
    form_title: String(data.form_title || EMPTY_SETTINGS.form_title),
    form_text: String(data.form_text || EMPTY_SETTINGS.form_text),
    transparency_title: String(
      data.transparency_title || EMPTY_SETTINGS.transparency_title
    ),
    transparency_text: String(
      data.transparency_text || EMPTY_SETTINGS.transparency_text
    ),
    success_title: String(data.success_title || EMPTY_SETTINGS.success_title),
    success_text: String(data.success_text || EMPTY_SETTINGS.success_text),
    legal_text: String(data.legal_text || EMPTY_SETTINGS.legal_text),
    results_title: String(data.results_title || EMPTY_SETTINGS.results_title),
    results_subtitle: String(
      data.results_subtitle || EMPTY_SETTINGS.results_subtitle
    ),
    adopted_label: String(data.adopted_label || EMPTY_SETTINGS.adopted_label),
    rescued_label: String(data.rescued_label || EMPTY_SETTINGS.rescued_label),
    rescued_dogs_count: Number(data.rescued_dogs_count || 0),
    preset_amounts: (Array.isArray(data.preset_amounts)
      ? data.preset_amounts
      : EMPTY_SETTINGS.preset_amounts
    )
      .map(Number)
      .filter((amount) => Number.isInteger(amount) && amount >= 100),
    impact_items: rawImpacts.slice(0, 8).map((item, index) => {
      const impact = item as Partial<ImpactItem>;
      return {
        id: String(impact.id || `action-${index + 1}`),
        icon: String(impact.icon || "🐾"),
        title: String(impact.title || "Action solidaire"),
        description: String(impact.description || ""),
      };
    }),
  };
}

function setField<K extends keyof DonationSettings>(
  setter: Dispatch<SetStateAction<DonationSettings>>,
  field: K,
  value: DonationSettings[K]
) {
  setter((current) => ({ ...current, [field]: value }));
}

function parseAmounts(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,;\n]+/)
        .map((item) => Number(item.replace(/\s/g, "")))
        .filter(
          (amount) =>
            Number.isInteger(amount) && amount >= 100 && amount <= 1000000
        )
    )
  )
    .sort((a, b) => a - b)
    .slice(0, 8);
}

function allocationLabel(value: string, impacts: ImpactItem[]) {
  if (value === "libre") return "Besoin le plus urgent";
  return impacts.find((item) => item.id === value)?.title || value;
}

function categoryLabel(value: FinanceEntry["category"]) {
  return EXPENSE_CATEGORIES.find(([key]) => key === value)?.[1] || "Dépense";
}

function pledgeStatusLabel(value: DonationPledge["status"]) {
  return {
    nouvelle: "Nouvelle",
    contactee: "Contactée",
    confirmee: "Confirmée",
    annulee: "Annulée",
  }[value];
}

function compareFinanceEntries(a: FinanceEntry, b: FinanceEntry) {
  return `${b.transaction_date}-${b.created_at}`.localeCompare(
    `${a.transaction_date}-${a.created_at}`
  );
}

function formatXpf(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} XPF`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatDate(value: string) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message || "Erreur inconnue");
  }
  return "Erreur inconnue";
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const escape = (value: string | number) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}