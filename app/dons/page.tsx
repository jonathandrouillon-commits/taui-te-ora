"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { supabase } from "../lib/supabase";

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

type FinancialSummary = {
  total_received: number;
  donation_count: number;
  total_spent: number;
  available_balance: number;
  nourriture_divers: number;
  sterilisation_castration: number;
  identification: number;
  soins: number;
  adopted_dogs: number;
  last_updated: string | null;
};

const EMPTY_FINANCIAL_SUMMARY: FinancialSummary = {
  total_received: 0,
  donation_count: 0,
  total_spent: 0,
  available_balance: 0,
  nourriture_divers: 0,
  sterilisation_castration: 0,
  identification: 0,
  soins: 0,
  adopted_dogs: 0,
  last_updated: null,
};

const INPUT_CLASS =
  "w-full rounded-2xl border border-[#ded5cb] bg-white px-4 py-3.5 text-[15px] text-[#2f241c] outline-none transition placeholder:text-[#a89d94] focus:border-[#df8995] focus:ring-4 focus:ring-[#df8995]/15";

export default function DonationPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<DonationSettings | null>(null);
  const [financialSummary, setFinancialSummary] =
    useState<FinancialSummary>(EMPTY_FINANCIAL_SUMMARY);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reference, setReference] = useState("");

  const [selectedAmount, setSelectedAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [frequency, setFrequency] = useState("unique");
  const [allocation, setAllocation] = useState("libre");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        const [settingsResult, financialResult] = await Promise.all([
          supabase
            .from("donation_page_settings")
            .select("*")
            .eq("singleton_key", true)
            .maybeSingle(),
          supabase.rpc("get_public_donation_financial_summary"),
        ]);

        const { data, error } = settingsResult;

        if (error) {
          throw error;
        }

        if (active && data?.is_published) {
          const normalized = normalizeSettings(data);
          setSettings(normalized);
          setSelectedAmount(String(normalized.preset_amounts[0] || ""));
        }

        if (!financialResult.error && active && financialResult.data) {
          setFinancialSummary(normalizeFinancialSummary(financialResult.data));
        } else if (financialResult.error) {
          console.error(
            "Erreur chargement transparence dons :",
            financialResult.error
          );
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active || !user) return;

        setEmail(user.email || "");

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          setFullName(
            [profile.first_name, profile.last_name]
              .filter(Boolean)
              .join(" ")
          );
        }
      } catch (error) {
        console.error("Erreur chargement page dons :", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPage();

    return () => {
      active = false;
    };
  }, []);

  const finalAmount = useMemo(() => {
    const raw = selectedAmount === "other" ? customAmount : selectedAmount;
    return Number(String(raw).replace(/\s/g, ""));
  }, [customAmount, selectedAmount]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings || submitting) return;

    setErrorMessage("");

    if (website) {
      setReference("MERCI");
      return;
    }

    if (!Number.isInteger(finalAmount) || finalAmount < 100) {
      setErrorMessage("Choisis un montant valide d’au moins 100 XPF.");
      return;
    }

    if (fullName.trim().length < 2) {
      setErrorMessage("Indique ton nom complet.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Indique une adresse e-mail valide.");
      return;
    }

    if (!consent) {
      setErrorMessage("Tu dois accepter l’enregistrement de cette promesse.");
      return;
    }

    try {
      setSubmitting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("donation_pledges")
        .insert({
          user_id: user?.id || null,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          amount_xpf: finalAmount,
          frequency,
          allocation,
          message: message.trim() || null,
          is_anonymous: isAnonymous,
          consent: true,
        })
        .select("id")
        .single();

      if (error) throw error;

      setReference(String(data.id).slice(0, 8).toUpperCase());
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: unknown) {
      console.error("Erreur promesse de don :", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setReference("");
    setMessage("");
    setConsent(false);
    setIsAnonymous(false);
    setCustomAmount("");
    setSelectedAmount(String(settings?.preset_amounts[0] || ""));
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef] px-5 pb-28">
        <p className="font-black text-[#064b42]">Chargement de la page dons…</p>
      </main>
    );
  }

  if (!settings) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef] px-5 pb-28">
        <div className="w-full max-w-xl rounded-[30px] bg-white p-8 text-center shadow-xl">
          <div className="text-5xl">🐾</div>
          <h1 className="mt-4 text-2xl font-black text-[#064b42]">
            Les promesses de don seront bientôt disponibles
          </h1>
          <p className="mt-3 text-[#6f665f]">
            Merci pour ton envie de soutenir les animaux de Polynésie.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-[#064b42] px-6 py-3 font-black text-white"
          >
            Retour à l’accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7ef] pb-32 text-[#2f241c]">
      <section className="relative overflow-hidden bg-[#064b42] px-5 pb-20 pt-10 text-white">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#df8995]/25 blur-2xl" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#f5cf79]/20 blur-2xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f6c4cc]">
            {settings.hero_badge}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
            {settings.hero_title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
            {settings.hero_subtitle}
          </p>

          <div className="mx-auto mt-9 flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-2xl">
            💝
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-10 grid max-w-6xl gap-7 px-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-7">
          <section className="rounded-[30px] border border-white/80 bg-white p-7 shadow-[0_18px_50px_rgba(58,43,35,.09)] sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#df8995]">
              Notre mission
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#064b42]">
              {settings.intro_title}
            </h2>
            <p className="mt-4 whitespace-pre-line leading-7 text-[#6f665f]">
              {settings.intro_text}
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {settings.impact_items.map((item) => (
              <article
                key={item.id}
                className="rounded-[25px] border border-[#eadfd8] bg-[#fffaf7] p-5 shadow-sm"
              >
                <div className="text-3xl">{item.icon}</div>
                <h3 className="mt-3 font-black text-[#064b42]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6f665f]">
                  {item.description}
                </p>
              </article>
            ))}
          </section>

          <section className="rounded-[30px] bg-[#f4e8d5] p-7 sm:p-9">
            <h2 className="text-2xl font-black text-[#704d2f]">
              {settings.transparency_title}
            </h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-[#765f4b]">
              {settings.transparency_text}
            </p>
          </section>
        </div>

        <section className="h-fit rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_22px_70px_rgba(58,43,35,.13)] sm:p-9 lg:sticky lg:top-5">
          {reference ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#e4f4ef] text-5xl">
                🐾
              </div>
              <h2 className="mt-6 text-3xl font-black text-[#064b42]">
                {settings.success_title}
              </h2>
              <p className="mx-auto mt-4 max-w-md whitespace-pre-line leading-7 text-[#6f665f]">
                {settings.success_text}
              </p>
              <div className="mx-auto mt-6 max-w-xs rounded-2xl bg-[#fbf7ef] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8c8178]">
                  Référence
                </p>
                <p className="mt-1 text-xl font-black text-[#064b42]">{reference}</p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="mt-7 rounded-full border-2 border-[#064b42] px-6 py-3 font-black text-[#064b42]"
              >
                Enregistrer une autre promesse
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#df8995]">
                Aucun prélèvement aujourd’hui
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#064b42]">
                {settings.form_title}
              </h2>
              <p className="mt-3 leading-7 text-[#6f665f]">{settings.form_text}</p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-6">
                <fieldset>
                  <legend className="mb-3 text-sm font-black text-[#43382f]">
                    Montant envisagé
                  </legend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {settings.preset_amounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setSelectedAmount(String(amount))}
                        className={`rounded-2xl border-2 px-3 py-3 font-black transition ${
                          selectedAmount === String(amount)
                            ? "border-[#df8995] bg-[#fdecef] text-[#a94f60]"
                            : "border-[#e8e0d8] bg-white text-[#064b42]"
                        }`}
                      >
                        {formatXpf(amount)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedAmount("other")}
                      className={`rounded-2xl border-2 px-3 py-3 font-black transition ${
                        selectedAmount === "other"
                          ? "border-[#df8995] bg-[#fdecef] text-[#a94f60]"
                          : "border-[#e8e0d8] bg-white text-[#064b42]"
                      }`}
                    >
                      Don libre
                    </button>
                  </div>
                  {selectedAmount === "other" && (
                    <div className="mt-3">
                      <label htmlFor="customAmount" className="sr-only">
                        Autre montant en XPF
                      </label>
                      <input
                        id="customAmount"
                        type="number"
                        min="100"
                        max="10000000"
                        step="100"
                        value={customAmount}
                        onChange={(event) => setCustomAmount(event.target.value)}
                        className={INPUT_CLASS}
                        placeholder="Montant en XPF"
                        required
                      />
                    </div>
                  )}
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-sm font-black text-[#43382f]">
                    Fréquence envisagée
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["unique", "Une fois"],
                      ["mensuelle", "Chaque mois"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFrequency(value)}
                        className={`rounded-2xl border-2 px-3 py-3 font-black ${
                          frequency === value
                            ? "border-[#064b42] bg-[#e8f3ef] text-[#064b42]"
                            : "border-[#e8e0d8] text-[#6f665f]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="allocation" className="mb-2 block text-sm font-black">
                    Action à soutenir
                  </label>
                  <select
                    id="allocation"
                    value={allocation}
                    onChange={(event) => setAllocation(event.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="libre">Là où le besoin est le plus urgent</option>
                    {settings.impact_items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="fullName" className="mb-2 block text-sm font-black">
                      Nom complet
                    </label>
                    <input
                      id="fullName"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className={INPUT_CLASS}
                      maxLength={120}
                      autoComplete="name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-black">
                      E-mail
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={INPUT_CLASS}
                      maxLength={254}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-black">
                      Téléphone (facultatif)
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className={INPUT_CLASS}
                      maxLength={40}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="mb-2 block text-sm font-black">
                    Message (facultatif)
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className={`${INPUT_CLASS} min-h-28 resize-y`}
                    maxLength={1000}
                    placeholder="Un mot pour l’association…"
                  />
                </div>

                <div className="absolute left-[-9999px]" aria-hidden="true">
                  <label htmlFor="website">Site internet</label>
                  <input
                    id="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#fbf7ef] p-4 text-sm leading-6 text-[#665b52]">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(event) => setIsAnonymous(event.target.checked)}
                    className="mt-1 h-5 w-5 accent-[#064b42]"
                  />
                  Je souhaite rester anonyme dans les éventuels remerciements publics.
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#fbf7ef] p-4 text-sm leading-6 text-[#665b52]">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-1 h-5 w-5 accent-[#064b42]"
                    required
                  />
                  J’accepte que mes coordonnées soient enregistrées afin d’être recontacté(e) au sujet de cette promesse de don.
                </label>

                {errorMessage && (
                  <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-[#df8995] px-6 py-4 text-base font-black text-white shadow-lg transition hover:bg-[#cf7482] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Enregistrement…"
                    : `Enregistrer ma promesse${finalAmount >= 100 ? ` de ${formatXpf(finalAmount)}` : ""}`}
                </button>

                <p className="text-center text-xs leading-5 text-[#8c8178]">
                  {settings.legal_text}
                </p>
              </form>
            </>
          )}
        </section>
      </div>

      <section className="mx-auto mt-10 max-w-6xl px-5">
        <div className="overflow-hidden rounded-[32px] bg-[#064b42] p-6 text-white shadow-[0_22px_70px_rgba(6,75,66,.18)] sm:p-9">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f6c4cc]">
                Compteur public
              </p>
              <h2 className="mt-2 text-3xl font-black">{settings.results_title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                {settings.results_subtitle}
              </p>
            </div>
            {financialSummary.last_updated && (
              <p className="text-xs text-white/55">
                Mis à jour le {formatDate(financialSummary.last_updated)}
              </p>
            )}
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <ResultCard
              icon="🏠"
              value={financialSummary.adopted_dogs}
              label={settings.adopted_label}
              detail="Calcul automatique des adoptions finalisées"
            />
            <ResultCard
              icon="🐕"
              value={settings.rescued_dogs_count}
              label={settings.rescued_label}
              detail="Résultat déclaré par l’association"
            />
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <CounterCard
              label="Dons encaissés"
              value={financialSummary.total_received}
              detail={`${financialSummary.donation_count} don${financialSummary.donation_count === 1 ? "" : "s"} enregistré${financialSummary.donation_count === 1 ? "" : "s"}`}
              tone="pink"
            />
            <CounterCard
              label="Sommes dépensées"
              value={financialSummary.total_spent}
              detail="Dépenses réelles enregistrées"
              tone="gold"
            />
            <CounterCard
              label="Solde disponible"
              value={financialSummary.available_balance}
              detail="Dons encaissés moins dépenses"
              tone="green"
            />
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ExpenseCard
              icon="🥣"
              label="Nourriture / divers"
              value={financialSummary.nourriture_divers}
              total={financialSummary.total_spent}
            />
            <ExpenseCard
              icon="✂️"
              label="Stérilisation / castration"
              value={financialSummary.sterilisation_castration}
              total={financialSummary.total_spent}
            />
            <ExpenseCard
              icon="🏷️"
              label="Identification"
              value={financialSummary.identification}
              total={financialSummary.total_spent}
            />
            <ExpenseCard
              icon="🩺"
              label="Soins"
              value={financialSummary.soins}
              total={financialSummary.total_spent}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function ResultCard({
  icon,
  value,
  label,
  detail,
}: {
  icon: string;
  value: number;
  label: string;
  detail: string;
}) {
  return (
    <article className="flex items-center gap-5 rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-3xl shadow-lg">
        {icon}
      </div>
      <div>
        <p className="text-4xl font-black text-[#f8d7dc]">{value}</p>
        <h3 className="mt-1 font-black">{label}</h3>
        <p className="mt-1 text-xs text-white/55">{detail}</p>
      </div>
    </article>
  );
}

function CounterCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone: "pink" | "gold" | "green";
}) {
  const colors = {
    pink: "bg-[#df8995]",
    gold: "bg-[#ad7d39]",
    green: "bg-[#0f6659]",
  };

  return (
    <div className={`rounded-[24px] p-5 shadow-lg ${colors[tone]}`}>
      <p className="text-xs font-black uppercase tracking-wider text-white/70">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{formatXpf(value)}</p>
      <p className="mt-2 text-xs text-white/65">{detail}</p>
    </div>
  );
}

function ExpenseCard({
  icon,
  label,
  value,
  total,
}: {
  icon: string;
  label: string;
  value: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <article className="rounded-[22px] border border-white/10 bg-white/10 p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-black">
          {percent}%
        </span>
      </div>
      <h3 className="mt-3 min-h-10 text-sm font-black">{label}</h3>
      <p className="mt-2 text-xl font-black text-[#f8d7dc]">{formatXpf(value)}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/20">
        <div
          className="h-full rounded-full bg-[#df8995] transition-all"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </article>
  );
}

function normalizeSettings(data: Record<string, unknown>): DonationSettings {
  const rawImpacts = Array.isArray(data.impact_items) ? data.impact_items : [];
  const impacts = rawImpacts
    .map((item, index) => {
      const value = item as Partial<ImpactItem>;
      return {
        id: String(value.id || `action-${index + 1}`),
        icon: String(value.icon || "🐾"),
        title: String(value.title || "Action solidaire"),
        description: String(value.description || ""),
      };
    })
    .slice(0, 8);

  const amounts = (Array.isArray(data.preset_amounts) ? data.preset_amounts : [])
    .map(Number)
    .filter((amount) => Number.isInteger(amount) && amount >= 100)
    .slice(0, 8);

  return {
    id: String(data.id || ""),
    is_published: Boolean(data.is_published),
    hero_badge: String(data.hero_badge || ""),
    hero_title: String(data.hero_title || ""),
    hero_subtitle: String(data.hero_subtitle || ""),
    intro_title: String(data.intro_title || ""),
    intro_text: String(data.intro_text || ""),
    form_title: String(data.form_title || ""),
    form_text: String(data.form_text || ""),
    transparency_title: String(data.transparency_title || ""),
    transparency_text: String(data.transparency_text || ""),
    success_title: String(data.success_title || ""),
    success_text: String(data.success_text || ""),
    legal_text: String(data.legal_text || ""),
    results_title: String(data.results_title || "Dons et résultats"),
    results_subtitle: String(data.results_subtitle || ""),
    adopted_label: String(data.adopted_label || "Chiens adoptés via l’application"),
    rescued_label: String(data.rescued_label || "Chiens sauvés de la rue"),
    rescued_dogs_count: Number(data.rescued_dogs_count || 0),
    preset_amounts: [100, 500, 1000, 2000],
    impact_items: impacts.length
      ? impacts
      : [
          {
            id: "aide",
            icon: "🐾",
            title: "Aide aux animaux",
            description: "Soutenir les besoins les plus urgents.",
          },
        ],
  };
}

function formatXpf(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} XPF`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function normalizeFinancialSummary(value: unknown): FinancialSummary {
  const data = (value || {}) as Record<string, unknown>;

  return {
    total_received: Number(data.total_received || 0),
    donation_count: Number(data.donation_count || 0),
    total_spent: Number(data.total_spent || 0),
    available_balance: Number(data.available_balance || 0),
    nourriture_divers: Number(data.nourriture_divers || 0),
    sterilisation_castration: Number(data.sterilisation_castration || 0),
    identification: Number(data.identification || 0),
    soins: Number(data.soins || 0),
    adopted_dogs: Number(data.adopted_dogs || 0),
    last_updated: data.last_updated ? String(data.last_updated) : null,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message || "Erreur inconnue");
  }
  return "Impossible d’enregistrer la promesse pour le moment.";
}
