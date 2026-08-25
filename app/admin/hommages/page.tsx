"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  Clock3,
  Eye,
  Mail,
  PawPrint,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type HommageStatus =
  | "pending"
  | "approved"
  | "rejected";

type Hommage = {
  id: string;
  user_id: string | null;
  animal_name: string;
  animal_type: string | null;
  birth_date: string | null;
  death_date: string | null;
  tribute_text: string;
  submitter_name: string | null;
  submitter_email: string;
  photo_url: string | null;
  status: HommageStatus;
  admin_note: string | null;
  created_at: string;
  approved_at: string | null;
};

type EditableHommage = Hommage & {
  saving?: boolean;
};

const STATUS_LABELS: Record<
  HommageStatus,
  string
> = {
  pending: "En attente",
  approved: "Publié",
  rejected: "Refusé",
};

export default function AdminHommagesPage() {
  const router =
    useRouter();

  const [loading, setLoading] =
    useState(true);

  const [hommages, setHommages] =
    useState<EditableHommage[]>([]);

  const [statusFilter, setStatusFilter] =
    useState<
      HommageStatus | ""
    >("pending");

  useEffect(() => {
    void loadHommages();
  }, []);

  async function checkAdmin() {
    const {
      data: {
        user,
      },
      error,
    } =
      await supabase.auth.getUser();

    if (
      error ||
      !user
    ) {
      router.replace(
        "/login?redirect=/admin/hommages"
      );
      return null;
    }

    const {
      data: profile,
      error:
        profileError,
    } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (
      profileError
    ) {
      throw profileError;
    }

    if (
      String(
        profile?.role || ""
      )
        .toLowerCase()
        .trim() !==
      "admin"
    ) {
      router.replace("/");
      return null;
    }

    return user;
  }

  async function loadHommages() {
    try {
      setLoading(true);

      const user =
        await checkAdmin();

      if (!user) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from("hommages")
          .select("*")
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (error) {
        throw error;
      }

      setHommages(
        (data ||
          []) as EditableHommage[]
      );
    } catch (
      error: any
    ) {
      console.error(
        "Erreur chargement hommages :",
        error
      );

      alert(
        error?.message ||
          "Impossible de charger les hommages."
      );
    } finally {
      setLoading(false);
    }
  }

  const filtered =
    useMemo(() => {
      if (!statusFilter) {
        return hommages;
      }

      return hommages.filter(
        (item) =>
          item.status ===
          statusFilter
      );
    }, [
      hommages,
      statusFilter,
    ]);

  const counts =
    useMemo(
      () => ({
        total:
          hommages.length,

        pending:
          hommages.filter(
            (item) =>
              item.status ===
              "pending"
          ).length,

        approved:
          hommages.filter(
            (item) =>
              item.status ===
              "approved"
          ).length,

        rejected:
          hommages.filter(
            (item) =>
              item.status ===
              "rejected"
          ).length,
      }),
      [hommages]
    );

  function updateLocal(
    id: string,
    field:
      keyof Hommage,
    value: any
  ) {
    setHommages(
      (
        previous
      ) =>
        previous.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  [field]:
                    value,
                }
              : item
        )
    );
  }

  function setSaving(
    id: string,
    saving: boolean
  ) {
    setHommages(
      (
        previous
      ) =>
        previous.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  saving,
                }
              : item
        )
    );
  }

  async function notifyOwner(
    item: Hommage,
    status:
      HommageStatus
  ) {
    if (!item.user_id) {
      return;
    }

    const title =
      status ===
      "approved"
        ? "Votre hommage a été publié"
        : status ===
            "rejected"
          ? "Mise à jour de votre hommage"
          : "Votre hommage est en attente";

    const message =
      status ===
      "approved"
        ? `L'hommage à ${item.animal_name} a été validé et publié sur Taui Te Ora.`
        : status ===
            "rejected"
          ? `L'hommage à ${item.animal_name} n'a pas été publié.`
          : `L'hommage à ${item.animal_name} est en cours de validation.`;

    const {
      error,
    } =
      await supabase
        .from(
          "notifications"
        )
        .insert({
          user_id:
            item.user_id,
          recipient_id:
            item.user_id,
          type:
            "hommage_status",
          title,
          message,
          is_read:
            false,
        });

    if (error) {
      console.error(
        "Erreur notification hommage :",
        error
      );
    }
  }

  async function saveHommage(
    item: EditableHommage
  ) {
    try {
      setSaving(
        item.id,
        true
      );

      const {
        error,
      } =
        await supabase
          .from("hommages")
          .update({
            animal_name:
              item.animal_name.trim(),

            animal_type:
              item.animal_type?.trim() ||
              null,

            birth_date:
              item.birth_date ||
              null,

            death_date:
              item.death_date ||
              null,

            tribute_text:
              item.tribute_text.trim(),

            submitter_name:
              item.submitter_name?.trim() ||
              null,

            submitter_email:
              item.submitter_email.trim(),

            admin_note:
              item.admin_note?.trim() ||
              null,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            item.id
          );

      if (error) {
        throw error;
      }

      alert(
        "Modifications enregistrées."
      );

      await loadHommages();
    } catch (
      error: any
    ) {
      alert(
        error?.message ||
          "Impossible d'enregistrer les modifications."
      );
    } finally {
      setSaving(
        item.id,
        false
      );
    }
  }

  async function setStatus(
    item: EditableHommage,
    status: HommageStatus
  ) {
    try {
      setSaving(
        item.id,
        true
      );

      const now =
        new Date()
          .toISOString();

      const {
        error,
      } =
        await supabase
          .from("hommages")
          .update({
            status,

            approved_at:
              status ===
              "approved"
                ? now
                : null,

            updated_at:
              now,
          })
          .eq(
            "id",
            item.id
          );

      if (error) {
        throw error;
      }

      await notifyOwner(
        item,
        status
      );

      await loadHommages();
    } catch (
      error: any
    ) {
      alert(
        error?.message ||
          "Impossible de modifier le statut."
      );
    } finally {
      setSaving(
        item.id,
        false
      );
    }
  }

  async function deleteHommage(
    item: EditableHommage
  ) {
    const confirmed =
      window.confirm(
        `Supprimer définitivement l'hommage à "${item.animal_name}" ?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(
        item.id,
        true
      );

      const {
        error,
      } =
        await supabase
          .from("hommages")
          .delete()
          .eq(
            "id",
            item.id
          );

      if (error) {
        throw error;
      }

      await loadHommages();
    } catch (
      error: any
    ) {
      alert(
        error?.message ||
          "Impossible de supprimer l'hommage."
      );
    } finally {
      setSaving(
        item.id,
        false
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-4 pb-16 pt-24 sm:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#df8995]">
              Administration
            </p>

            <h1 className="mt-2 text-4xl font-black text-[#064b42]">
              Gestion des hommages
            </h1>

            <p className="mt-2 text-gray-500">
              Relisez, modifiez et validez les hommages avant publication.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/dashboard"
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9cec5] bg-white px-5 py-3 font-black text-[#064b42] shadow"
          >
            <ArrowLeft
              size={18}
            />

            Retour admin
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Total"
            value={
              counts.total
            }
            className="bg-white"
          />

          <Stat
            label="En attente"
            value={
              counts.pending
            }
            className="border-amber-200 bg-amber-50 text-amber-800"
          />

          <Stat
            label="Publiés"
            value={
              counts.approved
            }
            className="border-green-200 bg-green-50 text-green-800"
          />

          <Stat
            label="Refusés"
            value={
              counts.rejected
            }
            className="border-red-200 bg-red-50 text-red-700"
          />
        </div>

        <section className="mt-8 rounded-[28px] bg-white p-5 shadow-lg">
          <label className="mb-2 block font-black text-[#064b42]">
            Filtrer par statut
          </label>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as
                  | HommageStatus
                  | ""
              )
            }
            className="w-full max-w-sm rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 font-bold text-[#064b42]"
          >
            <option value="">
              Tous les hommages
            </option>

            <option value="pending">
              En attente
            </option>

            <option value="approved">
              Publiés
            </option>

            <option value="rejected">
              Refusés
            </option>
          </select>
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="rounded-[30px] bg-white p-8 text-center shadow-lg">
              Chargement...
            </div>
          ) : filtered.length ===
            0 ? (
            <div className="rounded-[30px] bg-white p-8 text-center shadow-lg">
              Aucun hommage dans cette catégorie.
            </div>
          ) : (
            <div className="grid gap-6">
              {filtered.map(
                (item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-xl"
                  >
                    <div className="grid lg:grid-cols-[320px_1fr]">
                      <div className="bg-[#f1e8df]">
                        {item.photo_url ? (
                          <img
                            src={item.photo_url}
                            alt={
                              item.animal_name
                            }
                            className="h-72 w-full object-cover lg:h-full"
                          />
                        ) : (
                          <div className="flex h-72 items-center justify-center lg:h-full">
                            <PawPrint
                              size={64}
                              className="text-[#df8995]"
                            />
                          </div>
                        )}
                      </div>

                      <div className="p-5 sm:p-7">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                                item.status ===
                                "approved"
                                  ? "bg-green-100 text-green-800"
                                  : item.status ===
                                      "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {
                                STATUS_LABELS[
                                  item.status
                                ]
                              }
                            </span>

                            <p className="mt-2 text-sm text-gray-500">
                              Reçu le{" "}
                              {new Date(
                                item.created_at
                              ).toLocaleString(
                                "fr-FR"
                              )}
                            </p>
                          </div>

                          <a
                            href={`/hommage#${item.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-[#f8f4ec] px-4 py-2 text-sm font-black text-[#064b42]"
                          >
                            <Eye
                              size={16}
                            />

                            Page publique
                          </a>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                          <Field
                            label="Nom de l'animal"
                            value={
                              item.animal_name
                            }
                            onChange={(
                              value
                            ) =>
                              updateLocal(
                                item.id,
                                "animal_name",
                                value
                              )
                            }
                          />

                          <Field
                            label="Type d'animal"
                            value={
                              item.animal_type ||
                              ""
                            }
                            onChange={(
                              value
                            ) =>
                              updateLocal(
                                item.id,
                                "animal_type",
                                value
                              )
                            }
                          />

                          <DateField
                            label="Date de naissance"
                            value={
                              item.birth_date ||
                              ""
                            }
                            onChange={(
                              value
                            ) =>
                              updateLocal(
                                item.id,
                                "birth_date",
                                value ||
                                  null
                              )
                            }
                          />

                          <DateField
                            label="Date de décès / disparition"
                            value={
                              item.death_date ||
                              ""
                            }
                            onChange={(
                              value
                            ) =>
                              updateLocal(
                                item.id,
                                "death_date",
                                value ||
                                  null
                              )
                            }
                          />

                          <Field
                            label="Nom du déposant"
                            value={
                              item.submitter_name ||
                              ""
                            }
                            onChange={(
                              value
                            ) =>
                              updateLocal(
                                item.id,
                                "submitter_name",
                                value
                              )
                            }
                          />

                          <Field
                            label="E-mail"
                            value={
                              item.submitter_email
                            }
                            onChange={(
                              value
                            ) =>
                              updateLocal(
                                item.id,
                                "submitter_email",
                                value
                              )
                            }
                            type="email"
                            icon={
                              <Mail
                                size={16}
                              />
                            }
                          />
                        </div>

                        <div className="mt-5">
                          <label className="mb-2 block font-black text-[#064b42]">
                            Texte de l&apos;hommage
                          </label>

                          <textarea
                            rows={7}
                            value={
                              item.tribute_text
                            }
                            onChange={(
                              event
                            ) =>
                              updateLocal(
                                item.id,
                                "tribute_text",
                                event
                                  .target
                                  .value
                              )
                            }
                            className="w-full resize-y rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 leading-7 outline-none focus:border-[#064b42]"
                          />
                        </div>

                        <div className="mt-5">
                          <label className="mb-2 block font-black text-[#064b42]">
                            Note admin
                          </label>

                          <textarea
                            rows={3}
                            value={
                              item.admin_note ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              updateLocal(
                                item.id,
                                "admin_note",
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="Note interne, non publiée"
                            className="w-full resize-y rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
                          />
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={
                              item.saving
                            }
                            onClick={() =>
                              saveHommage(
                                item
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-full bg-[#e7f3ef] px-5 py-3 font-black text-[#064b42] disabled:opacity-60"
                          >
                            <Save
                              size={17}
                            />

                            Enregistrer
                          </button>

                          <button
                            type="button"
                            disabled={
                              item.saving
                            }
                            onClick={() =>
                              setStatus(
                                item,
                                "approved"
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-3 font-black text-white disabled:opacity-60"
                          >
                            <Check
                              size={17}
                            />

                            Valider et publier
                          </button>

                          <button
                            type="button"
                            disabled={
                              item.saving
                            }
                            onClick={() =>
                              setStatus(
                                item,
                                "rejected"
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-5 py-3 font-black text-orange-800 disabled:opacity-60"
                          >
                            <X
                              size={17}
                            />

                            Refuser
                          </button>

                          <button
                            type="button"
                            disabled={
                              item.saving
                            }
                            onClick={() =>
                              deleteHommage(
                                item
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-full bg-red-50 px-5 py-3 font-black text-red-600 disabled:opacity-60"
                          >
                            <Trash2
                              size={17}
                            />

                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[24px] border p-5 text-center shadow-sm ${className}`}
    >
      <p className="text-3xl font-black">
        {value}
      </p>

      <p className="mt-1 text-sm font-bold">
        {label}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  icon,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block font-black text-[#064b42]">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className={`w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] py-3 outline-none focus:border-[#064b42] ${
            icon
              ? "pl-11 pr-4"
              : "px-4"
          }`}
        />
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-black text-[#064b42]">
        {label}
      </label>

      <input
        type="date"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 py-3 outline-none focus:border-[#064b42]"
      />
    </div>
  );
}