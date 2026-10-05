"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  KeyRound,
  Save,
  UserPlus,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "../../../lib/supabase";

type RoleOption = {
  value: string;
  label: string;
};

type CreateResponse = {
  ok: boolean;
  user_id?: string;
  email?: string;
  temporary_password?: string;
  error?: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "adoptant",
    label: "Adoptant / Utilisateur",
  },
  {
    value: "association",
    label: "Association",
  },
  {
    value: "refuge",
    label: "Refuge",
  },
  {
    value: "sigfa",
    label: "SIGFA",
  },
  {
    value: "fourriere",
    label: "Fourrière",
  },
  {
    value: "benevole",
    label: "Bénévole",
  },
  {
    value: "famille_accueil",
    label: "Famille d'accueil",
  },
  {
    value: "admin",
    label: "Administrateur",
  },
];

function generatePassword() {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

  const values =
    crypto.getRandomValues(
      new Uint32Array(14)
    );

  return Array.from(
    values,
    (value) =>
      alphabet[
        value %
          alphabet.length
      ]
  ).join("");
}

export default function AdminCreateUserPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    copied,
    setCopied,
  ] = useState(false);

  const [
    result,
    setResult,
  ] = useState<CreateResponse | null>(
    null
  );

  const [
    form,
    setForm,
  ] = useState({
    email: "",
    first_name: "",
    last_name: "",
    organization_name: "",
    role: "adoptant",
    phone: "",
    island: "",
    city: "",
    password: "",
  });

  const isStructure =
    useMemo(
      () =>
        [
          "association",
          "refuge",
          "sigfa",
          "fourriere",
        ].includes(
          form.role
        ),
      [
        form.role,
      ]
    );

  const canSubmit =
    form.email
      .trim()
      .length > 3 &&
    form.role.length >
      0 &&
    form.password.length >=
      8 &&
    !saving;

  useEffect(() => {
    let cancelled =
      false;

    async function verifyAdmin() {
      try {
        const {
          data: {
            user,
          },
          error:
            authError,
        } =
          await supabase
            .auth
            .getUser();

        if (
          authError ||
          !user
        ) {
          router.replace(
            "/login?redirect=/admin/users/create"
          );

          return;
        }

        const {
          data:
            profile,
          error:
            profileError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "id, role, is_active"
            )
            .eq(
              "id",
              user.id
            )
            .maybeSingle();

        if (
          profileError
        ) {
          throw profileError;
        }

        const role =
          String(
            profile?.role ||
              ""
          )
            .trim()
            .toLowerCase();

        if (
          role !==
            "admin" ||
          profile?.is_active ===
            false
        ) {
          router.replace(
            "/"
          );

          return;
        }

        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      } catch (
        error
      ) {
        console.error(
          "Erreur accès création profil :",
          error
        );

        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      }
    }

    void verifyAdmin();

    return () => {
      cancelled =
        true;
    };
  }, [
    router,
  ]);

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setResult(null);

    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  }

  function createTemporaryPassword() {
    const password =
      generatePassword();

    updateField(
      "password",
      password
    );
  }

  async function createUser() {
    if (!canSubmit) {
      return;
    }

    try {
      setSaving(true);
      setCopied(false);
      setResult(null);

      const {
        data: {
          session,
        },
      } =
        await supabase
          .auth
          .getSession();

      const token =
        session?.access_token ||
        "";

      if (!token) {
        throw new Error(
          "Session expirée."
        );
      }

      const response =
        await fetch(
          "/api/admin/users/create",
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body:
              JSON.stringify({
                email:
                  form.email.trim(),
                password:
                  form.password,
                first_name:
                  form.first_name.trim(),
                last_name:
                  form.last_name.trim(),
                organization_name:
                  form.organization_name.trim(),
                role:
                  form.role,
                phone:
                  form.phone.trim(),
                island:
                  form.island.trim(),
                city:
                  form.city.trim(),
              }),
          }
        );

      const data =
        (await response.json()) as CreateResponse;

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.error ||
            "Impossible de créer le profil."
        );
      }

      setResult(
        data
      );
    } catch (
      error
    ) {
      alert(
        error instanceof
          Error
          ? error.message
          : "Erreur lors de la création du profil."
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyCredentials() {
    if (
      !result?.email ||
      !result.temporary_password
    ) {
      return;
    }

    const value =
      `Taui Te Ora\nE-mail : ${result.email}\nMot de passe temporaire : ${result.temporary_password}`;

    await navigator
      .clipboard
      .writeText(
        value
      );

    setCopied(true);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f1e8] px-4">
        <div className="rounded-[28px] bg-white px-8 py-7 text-center shadow-xl">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-[#dfeee8]" />
          <p className="mt-4 font-black text-[#07594f]">
            Chargement…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f1e8_0%,#fbf8f2_55%,#f2ece4_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/users"
              )
            }
            className="inline-flex items-center gap-2 rounded-full border border-[#ddd1c5] bg-[#fffaf4] px-4 py-2.5 text-sm font-black text-[#07594f] shadow-sm"
          >
            <ArrowLeft
              size={17}
            />
            Utilisateurs
          </button>

          <div className="rounded-full bg-[#fff0eb] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#d86f5c]">
            Administration
          </div>
        </div>

        <section className="overflow-hidden rounded-[34px] border border-[#0f675d]/10 bg-[#07594f] p-6 text-white shadow-[0_22px_65px_rgba(7,89,79,.18)] sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <UserPlus
                size={27}
              />
            </div>

            <div>
              <h1 className="text-3xl font-black">
                Créer un profil
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                Crée un compte Taui Te Ora pour une personne ou une structure qui n'a pas le temps de s'inscrire elle-même.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[30px] border border-[#e8ddd2] bg-[#fffaf4] p-5 shadow-[0_16px_45px_rgba(73,58,43,.06)] sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#8f8277]">
                Type de profil
              </span>

              <select
                value={
                  form.role
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "role",
                    event.target
                      .value
                  )
                }
                className="w-full rounded-[18px] border border-[#dfd3c8] bg-white px-4 py-3.5 text-sm font-bold text-[#2f2b27] outline-none focus:border-[#168273]"
              >
                {ROLE_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <Field
              label="Prénom"
              value={
                form.first_name
              }
              onChange={(
                value
              ) =>
                updateField(
                  "first_name",
                  value
                )
              }
            />

            <Field
              label="Nom"
              value={
                form.last_name
              }
              onChange={(
                value
              ) =>
                updateField(
                  "last_name",
                  value
                )
              }
            />

            {isStructure && (
              <div className="sm:col-span-2">
                <Field
                  label="Nom de la structure"
                  value={
                    form.organization_name
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "organization_name",
                      value
                    )
                  }
                />
              </div>
            )}

            <Field
              label="E-mail *"
              type="email"
              value={
                form.email
              }
              onChange={(
                value
              ) =>
                updateField(
                  "email",
                  value
                )
              }
            />

            <Field
              label="Téléphone"
              value={
                form.phone
              }
              onChange={(
                value
              ) =>
                updateField(
                  "phone",
                  value
                )
              }
            />

            <Field
              label="Île"
              value={
                form.island
              }
              onChange={(
                value
              ) =>
                updateField(
                  "island",
                  value
                )
              }
            />

            <Field
              label="Commune"
              value={
                form.city
              }
              onChange={(
                value
              ) =>
                updateField(
                  "city",
                  value
                )
              }
            />

            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-[0.1em] text-[#8f8277]">
                  Mot de passe temporaire *
                </span>

                <button
                  type="button"
                  onClick={
                    createTemporaryPassword
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f5f1] px-3 py-1.5 text-xs font-black text-[#07594f]"
                >
                  <KeyRound
                    size={14}
                  />
                  Générer
                </button>
              </div>

              <input
                type="text"
                value={
                  form.password
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "password",
                    event.target
                      .value
                  )
                }
                placeholder="Minimum 8 caractères"
                className="w-full rounded-[18px] border border-[#dfd3c8] bg-white px-4 py-3.5 text-sm font-semibold text-[#2f2b27] outline-none focus:border-[#168273]"
              />

              <p className="mt-2 text-xs leading-5 text-[#8d837a]">
                Le compte est créé actif et validé. Transmets ce mot de passe à la personne, qui pourra ensuite le modifier.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={
              !canSubmit
            }
            onClick={() =>
              void createUser()
            }
            className="mt-7 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#ef8f7c] px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-[#e67f6b] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save
              size={19}
            />
            {saving
              ? "Création en cours..."
              : "Créer le profil"}
          </button>
        </section>

        {result?.ok && (
          <section className="mt-6 rounded-[28px] border border-[#bcded3] bg-[#e8f6f1] p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#168273] text-white">
                <CheckCircle2
                  size={22}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-black text-[#07594f]">
                  Profil créé
                </h2>

                <p className="mt-2 text-sm text-[#47675f]">
                  E-mail :{" "}
                  <strong>
                    {
                      result.email
                    }
                  </strong>
                </p>

                <p className="mt-1 break-all text-sm text-[#47675f]">
                  Mot de passe temporaire :{" "}
                  <strong>
                    {
                      result.temporary_password
                    }
                  </strong>
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void copyCredentials()
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-[#07594f] shadow-sm"
                  >
                    <Copy
                      size={15}
                    />
                    {copied
                      ? "Copié"
                      : "Copier les accès"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/admin/users"
                      )
                    }
                    className="rounded-full bg-[#07594f] px-4 py-2 text-xs font-black text-white"
                  >
                    Voir les utilisateurs
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange:
    (value: string) =>
      void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#8f8277]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="w-full rounded-[18px] border border-[#dfd3c8] bg-white px-4 py-3.5 text-sm font-semibold text-[#2f2b27] outline-none focus:border-[#168273]"
      />
    </label>
  );
}
