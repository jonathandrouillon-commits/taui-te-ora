"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Database,
  Download,
  Eye,
  FileText,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../lib/i18n";

type ProfileData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  island: string | null;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  role: string | null;
  organization_name: string | null;
  preferred_language: string | null;
  created_at?: string | null;
};

export default function MesDonneesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const en = language === "en";
  const tr = (fr: string, english: string) => (en ? english : fr);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login?redirect=/profile/mes-donnees");
        return;
      }

      setAuthEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
            id,
            first_name,
            last_name,
            email,
            phone,
            birth_date,
            island,
            city,
            address,
            postal_code,
            role,
            organization_name,
            preferred_language,
            created_at
          `
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Profil utilisateur introuvable.");

      setProfile(data as ProfileData);
    } catch (error: unknown) {
      console.error("Erreur chargement Mes données :", error);
      alert(
        error instanceof Error
          ? error.message
          : tr(
              "Impossible de charger vos données.",
              "Unable to load your data."
            )
      );
    } finally {
      setLoading(false);
    }
  }

  function valueOrDash(value: string | null | undefined) {
    const clean = String(value || "").trim();
    return clean || "—";
  }

  function roleLabel(role: string | null) {
    switch (String(role || "").toLowerCase()) {
      case "admin":
        return tr("Administration", "Administration");
      case "association":
        return tr("Association", "Association");
      case "refuge":
        return tr("Refuge / SIGFA", "Shelter / SIGFA");
      case "fourriere":
        return tr("Fourrière", "Pound");
      case "benevole":
        return tr("Bénévole", "Volunteer");
      case "adoptant":
        return tr("Utilisateur", "User");
      default:
        return tr("Utilisateur", "User");
    }
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  function exportAccountSummary() {
    if (!profile || exporting) return;

    try {
      setExporting(true);

      /*
        ETAPE 2 :
        Cet export concerne les informations principales du profil
        actuellement affichées sur cette page.

        Un export RGPD complet de toutes les tables liées au compte
        (messages, signalements, adoptions, compagnons, SOS, balades...)
        sera ajouté après inventaire des relations de base de données.
      */

      const exportData = {
        export_information: {
          generated_at: new Date().toISOString(),
          scope: en
            ? "TAUI TE ORA account and profile summary"
            : "Résumé du compte et du profil TAUI TE ORA",
        },
        account: {
          id: profile.id,
          authentication_email: authEmail || null,
          role: profile.role,
          preferred_language: profile.preferred_language,
          created_at: profile.created_at || null,
        },
        profile: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone: profile.phone,
          birth_date: profile.birth_date,
          island: profile.island,
          city: profile.city,
          address: profile.address,
          postal_code: profile.postal_code,
          organization_name: profile.organization_name,
        },
      };

      const blob = new Blob(
        [JSON.stringify(exportData, null, 2)],
        { type: "application/json;charset=utf-8" }
      );

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);

      anchor.href = url;
      anchor.download = `taui-te-ora-mes-donnees-${date}.json`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur export des données :", error);
      alert(
        tr(
          "Impossible de préparer le fichier.",
          "Unable to prepare the file."
        )
      );
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    if (deleting || deleteConfirmation !== "SUPPRIMER") return;

    try {
      setDeleting(true);
      setDeleteError("");

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      const accessToken = sessionData.session?.access_token;

      if (sessionError || !accessToken) {
        throw new Error(
          tr(
            "Votre session a expiré. Reconnectez-vous avant de supprimer votre compte.",
            "Your session has expired. Please sign in again before deleting your account."
          )
        );
      }

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ confirmation: "SUPPRIMER" }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        partial?: boolean;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            tr(
              "La suppression du compte n'a pas pu être terminée.",
              "Account deletion could not be completed."
            )
        );
      }

      await supabase.auth.signOut();
      window.localStorage.removeItem("taui-te-ora-language");
      window.location.replace("/");
    } catch (error: unknown) {
      console.error("Erreur suppression du compte :", error);
      setDeleteError(
        error instanceof Error
          ? error.message
          : tr(
              "Une erreur est survenue pendant la suppression du compte.",
              "An error occurred while deleting the account."
            )
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f8f4ec] px-5">
        <div className="rounded-[28px] bg-white px-8 py-7 text-center shadow-xl">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#eadfd8] border-t-[#064b42]" />
          <p className="mt-4 font-black text-[#064b42]">
            {tr(
              "Chargement de vos données...",
              "Loading your data..."
            )}
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f8f4ec] px-5">
        <div className="max-w-lg rounded-[28px] bg-white p-8 text-center shadow-xl">
          <Shield
            size={38}
            className="mx-auto text-[#df8995]"
          />
          <h1 className="mt-4 text-2xl font-black text-[#064b42]">
            {tr(
              "Données indisponibles",
              "Data unavailable"
            )}
          </h1>
          <Link
            href="/profile"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#064b42] px-6 py-3 font-black text-white"
          >
            <ArrowLeft size={18} />
            {tr("Retour au profil", "Back to profile")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f8f4ec] px-4 py-6 pb-28 text-[#064b42] sm:px-6 sm:py-10">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 rounded-full border border-[#eadfd8] bg-white px-4 py-2 text-sm font-black text-[#064b42] shadow-sm"
        >
          <ArrowLeft size={17} />
          {tr("Retour au profil", "Back to profile")}
        </Link>

        <div className="mt-5 overflow-hidden rounded-[34px] bg-white shadow-xl">
          <div className="bg-gradient-to-br from-[#f7dfe3] via-[#f7eee7] to-[#e3efe8] px-6 py-8 sm:px-9">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#c76d7b]">
                  TAUI TE ORA
                </p>

                <h1 className="mt-2 text-4xl font-black text-[#064b42] sm:text-5xl">
                  {tr("Mes données", "My Data")}
                </h1>

                <p className="mt-3 max-w-2xl leading-7 text-[#6f665f]">
                  {tr(
                    "Retrouvez les principales informations liées à votre compte et gérez vos choix concernant vos données personnelles.",
                    "Review the main information associated with your account and manage your personal-data choices."
                  )}
                </p>
              </div>

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-white/80 text-[#064b42] shadow-sm">
                <Database size={34} />
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-9">
            <section className="rounded-[28px] border border-[#eee2da] bg-[#fffaf7] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <UserRound
                  size={25}
                  className="mt-1 shrink-0 text-[#c76d7b]"
                />
                <div>
                  <h2 className="text-2xl font-black text-[#064b42]">
                    {tr(
                      "Informations de mon compte",
                      "My account information"
                    )}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#6f665f]">
                    {tr(
                      "Ces informations proviennent de votre compte et de votre profil TAUI TE ORA.",
                      "This information comes from your TAUI TE ORA account and profile."
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <DataItem
                  label={tr("Prénom", "First name")}
                  value={valueOrDash(profile.first_name)}
                />
                <DataItem
                  label={tr("Nom", "Last name")}
                  value={valueOrDash(profile.last_name)}
                />
                <DataItem
                  label={tr("Email du compte", "Account email")}
                  value={valueOrDash(authEmail || profile.email)}
                />
                <DataItem
                  label={tr("Téléphone", "Phone")}
                  value={valueOrDash(profile.phone)}
                />
                <DataItem
                  label={tr("Date de naissance", "Date of birth")}
                  value={formatDate(profile.birth_date)}
                />
                <DataItem
                  label={tr("Type de compte", "Account type")}
                  value={roleLabel(profile.role)}
                />
                <DataItem
                  label={tr("Île", "Island")}
                  value={valueOrDash(profile.island)}
                />
                <DataItem
                  label={tr("Commune", "Municipality")}
                  value={valueOrDash(profile.city)}
                />
                <DataItem
                  label={tr("Code postal", "Postal code")}
                  value={valueOrDash(profile.postal_code)}
                />
                <DataItem
                  label={tr("Adresse", "Address")}
                  value={valueOrDash(profile.address)}
                />
                {profile.organization_name && (
                  <DataItem
                    label={tr(
                      "Structure",
                      "Organisation"
                    )}
                    value={profile.organization_name}
                  />
                )}
                <DataItem
                  label={tr(
                    "Langue préférée",
                    "Preferred language"
                  )}
                  value={
                    profile.preferred_language === "en"
                      ? "English"
                      : "Français"
                  }
                />
              </div>

              <Link
                href="/profile"
                className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#064b42] px-6 py-3 font-black text-white"
              >
                {tr(
                  "Modifier mes informations",
                  "Edit my information"
                )}
              </Link>
            </section>

            <section className="mt-6 rounded-[28px] border border-[#dcebe5] bg-[#edf6f2] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <Eye
                  size={25}
                  className="mt-1 shrink-0 text-[#064b42]"
                />
                <div>
                  <h2 className="text-2xl font-black text-[#064b42]">
                    {tr(
                      "Ce qui peut être visible",
                      "What may be visible"
                    )}
                  </h2>

                  <p className="mt-2 leading-7 text-[#607069]">
                    {tr(
                      "Certaines informations peuvent être rendues visibles lorsque vous utilisez une fonction communautaire : profil d’un animal, signalement, balade, événement, demande d’aide ou autre contenu que vous choisissez de publier.",
                      "Some information may become visible when you use a community feature: an animal profile, report, walk, event, help request or other content you choose to publish."
                    )}
                  </p>

                  <p className="mt-3 font-bold leading-7 text-[#064b42]">
                    {tr(
                      "Vos coordonnées privées et vos conversations ne sont pas destinées à être affichées publiquement.",
                      "Your private contact details and conversations are not intended to be displayed publicly."
                    )}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-[28px] border border-[#eee2da] bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <Lock
                  size={25}
                  className="mt-1 shrink-0 text-[#c76d7b]"
                />
                <div>
                  <h2 className="text-2xl font-black text-[#064b42]">
                    {tr(
                      "Services utilisant mes données",
                      "Services using my data"
                    )}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#6f665f]">
                    {tr(
                      "Selon les fonctionnalités que vous utilisez, des données supplémentaires peuvent être associées à votre compte.",
                      "Depending on the features you use, additional data may be associated with your account."
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ServiceItem
                  icon={<UserRound size={20} />}
                  text={tr(
                    "Profil et compte",
                    "Profile and account"
                  )}
                />
                <ServiceItem
                  icon={<FileText size={20} />}
                  text={tr(
                    "Demandes d’adoption",
                    "Adoption applications"
                  )}
                />
                <ServiceItem
                  icon={<MapPin size={20} />}
                  text={tr(
                    "Signalements et localisation",
                    "Reports and location"
                  )}
                />
                <ServiceItem
                  icon={<MessageCircle size={20} />}
                  text={tr(
                    "Messagerie",
                    "Messaging"
                  )}
                />
                <ServiceItem
                  icon={<Shield size={20} />}
                  text={tr(
                    "SOS et réseau d’aide",
                    "SOS and help network"
                  )}
                />
                <ServiceItem
                  icon={<Database size={20} />}
                  text={tr(
                    "Mes Compagnons et activités",
                    "My Companions and activities"
                  )}
                />
              </div>
            </section>

            <section className="mt-6 rounded-[28px] border border-[#eee2da] bg-[#fffaf7] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <Download
                  size={25}
                  className="mt-1 shrink-0 text-[#c76d7b]"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-black text-[#064b42]">
                    {tr(
                      "Télécharger mes données",
                      "Download my data"
                    )}
                  </h2>

                  <p className="mt-2 leading-7 text-[#6f665f]">
                    {tr(
                      "Pour cette première étape, vous pouvez télécharger un résumé de vos informations de compte et de profil au format JSON.",
                      "For this first step, you can download a JSON summary of your account and profile information."
                    )}
                  </p>

                  <p className="mt-3 text-sm font-bold leading-6 text-[#9a6b45]">
                    {tr(
                      "L’export complet de toutes les données liées aux autres services sera ajouté après vérification des relations entre les différentes tables de la plateforme.",
                      "A complete export of data linked to the other services will be added after the relationships between the platform’s database tables have been verified."
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={exportAccountSummary}
                    disabled={exporting}
                    className="mt-5 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#df8995] px-6 py-3 font-black text-white shadow disabled:opacity-60"
                  >
                    <Download size={18} />
                    {exporting
                      ? tr(
                          "Préparation...",
                          "Preparing..."
                        )
                      : tr(
                          "Télécharger mon résumé",
                          "Download my summary"
                        )}
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-[28px] border border-[#dcebe5] bg-[#edf6f2] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <Shield
                  size={25}
                  className="mt-1 shrink-0 text-[#064b42]"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-black text-[#064b42]">
                    {tr(
                      "Confidentialité et mes droits",
                      "Privacy and my rights"
                    )}
                  </h2>

                  <p className="mt-2 leading-7 text-[#607069]">
                    {tr(
                      "Consultez les informations sur l’utilisation de vos données, leur protection et les droits dont vous disposez.",
                      "Read information about how your data is used, protected and the rights available to you."
                    )}
                  </p>

                  <Link
                    href="/confidentialite"
                    className="mt-5 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#064b42] px-6 py-3 font-black text-white"
                  >
                    <FileText size={18} />
                    {tr(
                      "Politique de confidentialité",
                      "Privacy policy"
                    )}
                  </Link>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-[28px] border border-[#eee2da] bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <Mail
                  size={25}
                  className="mt-1 shrink-0 text-[#c76d7b]"
                />
                <div>
                  <h2 className="text-2xl font-black text-[#064b42]">
                    {tr(
                      "Une question sur mes données ?",
                      "A question about my data?"
                    )}
                  </h2>

                  <p className="mt-2 leading-7 text-[#6f665f]">
                    {tr(
                      "Vous pouvez contacter TAUI TE ORA pour une demande relative à vos données personnelles.",
                      "You can contact TAUI TE ORA with a request concerning your personal data."
                    )}
                  </p>

                  <a
                    href="mailto:lesveilleursdekali@gmail.com"
                    className="mt-4 inline-flex font-black text-[#c75f70] underline decoration-2 underline-offset-4"
                  >
                    lesveilleursdekali@gmail.com
                  </a>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-[28px] border border-red-200 bg-red-50 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <Trash2 size={25} className="mt-1 shrink-0 text-red-600" />

                <div className="flex-1">
                  <h2 className="text-2xl font-black text-red-700">
                    {tr("Supprimer mon compte", "Delete my account")}
                  </h2>

                  <p className="mt-2 leading-7 text-red-900/75">
                    {tr(
                      "Cette action est irréversible. Votre compte de connexion et vos données personnelles liées au compte seront supprimés ou anonymisés selon leur nature. Certaines informations utiles à la protection animale peuvent être conservées sans être rattachées à votre identité.",
                      "This action is irreversible. Your sign-in account and personal data linked to it will be deleted or anonymised depending on their nature. Some information useful for animal protection may be retained without being linked to your identity."
                    )}
                  </p>

                  {(profile.role === "admin" ||
                    profile.role === "administrateur") ? (
                    <div className="mt-5 rounded-[20px] border border-red-300 bg-white p-4 font-bold leading-6 text-red-700">
                      {tr(
                        "Par sécurité, un compte administrateur ne peut pas être supprimé depuis cette interface.",
                        "For security reasons, an administrator account cannot be deleted from this interface."
                      )}
                    </div>
                  ) : !deleteOpen ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteOpen(true);
                        setDeleteError("");
                      }}
                      className="mt-5 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 font-black text-white shadow hover:bg-red-700"
                    >
                      <Trash2 size={18} />
                      {tr("Supprimer mon compte", "Delete my account")}
                    </button>
                  ) : (
                    <div className="mt-5 rounded-[24px] border-2 border-red-300 bg-white p-5">
                      <p className="font-black text-red-700">
                        {tr(
                          "Confirmation finale",
                          "Final confirmation"
                        )}
                      </p>

                      <p className="mt-2 text-sm font-bold leading-6 text-[#6f665f]">
                        {tr(
                          "Pour confirmer la suppression définitive, écrivez exactement SUPPRIMER dans le champ ci-dessous.",
                          "To confirm permanent deletion, type SUPPRIMER exactly in the field below."
                        )}
                      </p>

                      <input
                        type="text"
                        value={deleteConfirmation}
                        onChange={(event) => {
                          setDeleteConfirmation(event.target.value);
                          setDeleteError("");
                        }}
                        disabled={deleting}
                        autoComplete="off"
                        placeholder="SUPPRIMER"
                        className="mt-4 min-h-[50px] w-full rounded-2xl border-2 border-red-200 bg-white px-4 font-black text-red-700 outline-none focus:border-red-500 disabled:opacity-60"
                      />

                      {deleteError && (
                        <div className="mt-4 rounded-2xl bg-red-100 p-4 text-sm font-bold leading-6 text-red-800">
                          {deleteError}
                        </div>
                      )}

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteOpen(false);
                            setDeleteConfirmation("");
                            setDeleteError("");
                          }}
                          disabled={deleting}
                          className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-[#d8cec7] bg-white px-6 py-3 font-black text-[#6f665f] disabled:opacity-50"
                        >
                          {tr("Annuler", "Cancel")}
                        </button>

                        <button
                          type="button"
                          onClick={() => void deleteAccount()}
                          disabled={
                            deleting || deleteConfirmation !== "SUPPRIMER"
                          }
                          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 font-black text-white shadow disabled:cursor-not-allowed disabled:bg-red-200 disabled:text-red-500"
                        >
                          <Trash2 size={18} />
                          {deleting
                            ? tr(
                                "Suppression en cours...",
                                "Deleting account..."
                              )
                            : tr(
                                "Supprimer définitivement mon compte",
                                "Permanently delete my account"
                              )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div className="mt-7 rounded-[22px] bg-[#f8f4ec] p-4 text-sm leading-6 text-[#6f665f]">
              {tr(
                "Cette page ne modifie pas vos données automatiquement. Les modifications de votre profil restent accessibles depuis Mon profil.",
                "This page does not automatically modify your data. Profile changes remain available from My Profile."
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function DataItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] bg-[#f8f4ec] p-4">
      <p className="text-xs font-black uppercase tracking-wide text-[#a98b73]">
        {label}
      </p>
      <p className="mt-2 break-words font-black text-[#064b42]">
        {value}
      </p>
    </div>
  );
}

function ServiceItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] bg-[#f8f4ec] px-4 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#c76d7b]">
        {icon}
      </div>
      <span className="font-black text-[#064b42]">
        {text}
      </span>
    </div>
  );
}
