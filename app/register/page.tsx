"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type UserRole =
  | "adoptant"
  | "association"
  | "refuge"
  | "benevole"
  | "fourriere";

const ALLOWED_ROLES: UserRole[] = [
  "adoptant",
  "association",
  "refuge",
  "benevole",
  "fourriere",
];

const ROLE_LABELS: Record<UserRole, string> = {
  adoptant: "Adoptant",
  association: "Association",
  refuge: "Refuge / SIGFA",
  benevole: "Bénévole indépendant",
  fourriere: "Fourrière",
};

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] =
    useState<UserRole>("adoptant");

  const [redirectAfterAuth, setRedirectAfterAuth] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [cooldown, setCooldown] =
    useState(false);

  const [logoFile, setLogoFile] =
    useState<File | null>(null);

  const [logoPreview, setLogoPreview] =
    useState("");

  const [fullName, setFullName] =
    useState("");

  const [
    organizationName,
    setOrganizationName,
  ] = useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [island, setIsland] =
    useState("");

  const [city, setCity] =
    useState("");

  /*
   * Récupération :
   *
   * /register?role=association
   * /register?role=refuge
   * etc.
   *
   * On récupère également un éventuel redirect
   * venant d'une Swipe Card.
   */
  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const requestedRole =
      params.get("role");

    const redirect =
      params.get("redirect") || "";

    if (
      requestedRole &&
      ALLOWED_ROLES.includes(
        requestedRole as UserRole
      )
    ) {
      setRole(
        requestedRole as UserRole
      );
    }

    setRedirectAfterAuth(redirect);
  }, []);

  /*
   * Nettoyage de l'aperçu image.
   */
  useEffect(() => {
    if (!logoFile) {
      setLogoPreview("");
      return;
    }

    const preview =
      URL.createObjectURL(logoFile);

    setLogoPreview(preview);

    return () => {
      URL.revokeObjectURL(preview);
    };
  }, [logoFile]);

  /*
   * Association / Refuge / Fourrière
   * représentent une structure.
   */
  const isOrganization =
    role === "association" ||
    role === "refuge" ||
    role === "fourriere";

  /*
   * Tous les profils sauf Adoptant
   * peuvent publier des animaux.
   */
  const canPublishAnimals =
    role !== "adoptant";

  /*
   * Logo / photo de profil proposé
   * aux comptes pouvant publier.
   */
  const canUploadAvatar =
    canPublishAnimals;

  const roleLabel =
    ROLE_LABELS[role];

  /*
   * Texte adapté au type de compte.
   */
  const organizationPlaceholder =
    useMemo(() => {
      switch (role) {
        case "association":
          return "Nom de l'association";

        case "refuge":
          return "Nom du refuge / SIGFA";

        case "fourriere":
          return "Nom de la fourrière";

        default:
          return "";
      }
    }, [role]);

  /*
   * Destination principale après
   * création / connexion.
   */
  function getDefaultDestination(
    currentRole: UserRole
  ) {
    switch (currentRole) {
      case "adoptant":
        return "/adoptant/questionnaire";

      case "association":
        return "/association/dashboard";

      case "refuge":
        return "/refuge/dashboard";

      case "benevole":
        return "/benevole/dashboard";

      case "fourriere":
        return "/fourriere/dashboard";

      default:
        return "/";
    }
  }

  /*
   * Pour un Adoptant, le questionnaire
   * reste obligatoire avant de reprendre
   * une éventuelle demande d'adoption.
   *
   * On transmet donc le redirect au
   * questionnaire.
   */
  function getDestinationAfterSignup() {
    if (role === "adoptant") {
      if (redirectAfterAuth) {
        return (
          "/adoptant/questionnaire" +
          "?redirect=" +
          encodeURIComponent(
            redirectAfterAuth
          )
        );
      }

      return "/adoptant/questionnaire";
    }

    if (redirectAfterAuth) {
      return redirectAfterAuth;
    }

    return getDefaultDestination(role);
  }

  /*
   * Upload logo/photo.
   */
  async function uploadLogo() {
    if (
      !logoFile ||
      !canUploadAvatar
    ) {
      return "";
    }

    const safeName = logoFile.name
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9.-]/g,
        "-"
      )
      .toLowerCase();

    const folder =
      isOrganization
        ? "organization-logos"
        : "volunteer-profiles";

    const path =
      `${folder}/${Date.now()}-${safeName}`;

    const { error } =
      await supabase.storage
        .from("profiles")
        .upload(
          path,
          logoFile,
          {
            upsert: true,
          }
        );

    if (error) {
      throw error;
    }

    const { data } =
      supabase.storage
        .from("profiles")
        .getPublicUrl(path);

    return data.publicUrl;
  }

  /*
   * Notification administrateur.
   */
  async function notifyAdmin({
    firstName,
    lastName,
    avatarUrl,
  }: {
    firstName: string;
    lastName: string;
    avatarUrl: string;
  }) {
    try {
      await fetch(
        "/api/send-new-user",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),

            first_name:
              firstName,

            last_name:
              lastName,

            role,

            role_label:
              roleLabel,

            organization_name:
              isOrganization
                ? organizationName.trim()
                : "",

            phone:
              phone.trim(),

            island:
              island.trim(),

            city:
              city.trim(),

            avatar_url:
              avatarUrl,

            can_publish_animals:
              canPublishAnimals,
          }),
        }
      );
    } catch (error) {
      console.error(
        "ERREUR EMAIL ADMIN:",
        error
      );
    }
  }

  function isRateLimitError(
    error: any
  ) {
    const message =
      String(
        error?.message || ""
      ).toLowerCase();

    return (
      message.includes(
        "email rate limit"
      ) ||
      message.includes(
        "rate limit"
      ) ||
      message.includes(
        "too many"
      ) ||
      message.includes(
        "exceeded"
      )
    );
  }

  /*
   * Création du compte.
   */
  async function register() {
    try {
      if (cooldown) {
        return;
      }

      setLoading(true);

      if (
        !fullName.trim() ||
        !email.trim() ||
        !password.trim()
      ) {
        alert(
          "Merci de remplir le nom complet, l'email et le mot de passe."
        );

        return;
      }

      if (
        isOrganization &&
        !organizationName.trim()
      ) {
        alert(
          `Merci d'indiquer ${organizationPlaceholder.toLowerCase()}.`
        );

        return;
      }

      if (
        password.length < 6
      ) {
        alert(
          "Le mot de passe doit contenir au moins 6 caractères."
        );

        return;
      }

      const nameParts =
        fullName
          .trim()
          .split(/\s+/);

      const firstName =
        nameParts[0] || "";

      const lastName =
        nameParts
          .slice(1)
          .join(" ");

      const avatarUrl =
        await uploadLogo();

      const {
        data,
        error,
      } =
        await supabase.auth.signUp(
          {
            email:
              email.trim(),

            password,

            options: {
              data: {
                first_name:
                  firstName,

                last_name:
                  lastName,

                full_name:
                  fullName.trim(),

                organization_name:
                  isOrganization
                    ? organizationName.trim()
                    : "",

                role,

                role_label:
                  roleLabel,

                phone:
                  phone.trim(),

                island:
                  island.trim(),

                city:
                  city.trim(),

                avatar_url:
                  avatarUrl,

                can_publish_animals:
                  canPublishAnimals,

                /*
                 * On conserve pour le moment
                 * ton fonctionnement actuel :
                 * compte actif directement.
                 */
                approval_status:
                  "approved",

                is_active:
                  true,

                is_verified:
                  true,

                approved_at:
                  new Date().toISOString(),
              },
            },
          }
        );

      if (error) {
        if (
          isRateLimitError(error)
        ) {
          setCooldown(true);

          alert(
            "Trop de demandes d'inscription ont été envoyées. Merci d'attendre quelques minutes avant de réessayer."
          );

          setTimeout(() => {
            setCooldown(false);
          }, 60000);

          return;
        }

        throw error;
      }

      await notifyAdmin({
        firstName,
        lastName,
        avatarUrl,
      });

      const destination =
        getDestinationAfterSignup();

      /*
       * Supabase a créé directement
       * une session.
       */
      if (data.session) {
        alert(
          "Votre compte a été créé. Vous êtes maintenant connecté."
        );

        router.push(
          destination
        );

        router.refresh();

        return;
      }

      /*
       * Si confirmation email requise,
       * on garde la destination dans
       * l'URL du login.
       */
      alert(
        "Votre compte a été créé avec succès. Connectez-vous pour continuer."
      );

      router.push(
        "/login?redirect=" +
          encodeURIComponent(
            destination
          )
      );
    } catch (error: any) {
      console.error(
        "ERREUR CREATION COMPTE COMPLETE:",
        error
      );

      alert(
        error?.message ||
          "Erreur inconnue lors de la création du compte."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="
        min-h-[100dvh]
        bg-[#f5ead8]
        px-4
        py-6
        text-[#3b2417]
        sm:p-6
      "
    >
      <section
        className="
          mx-auto
          max-w-4xl
          rounded-[32px]
          border
          border-[#e4cfaa]
          bg-[#fff3dc]
          p-5
          shadow-2xl
          sm:p-8
        "
      >
        {/* HEADER */}

        <div className="text-center">
          <img
            src="/logo-taui-te-ora.png"
            alt="Taui Te Ora"
            className="
              mx-auto
              h-28
              w-28
              object-contain
            "
          />

          <h1
            className="
              mt-3
              text-3xl
              font-black
              text-[#064b42]
              sm:text-5xl
            "
          >
            Créer un compte
          </h1>

          <p
            className="
              mt-2
              text-gray-600
            "
          >
            Profil sélectionné :
          </p>

          <div
            className="
              mx-auto
              mt-3
              inline-flex
              rounded-full
              bg-[#ef919b]
              px-5
              py-2
              text-sm
              font-black
              text-white
              shadow
            "
          >
            {roleLabel}
          </div>
        </div>

        {/* CHANGER DE PROFIL */}

        <div
          className="
            mt-6
            flex
            justify-center
          "
        >
          <button
            type="button"
            onClick={() =>
              router.push(
                "/choose-role"
              )
            }
            className="
              text-sm
              font-bold
              text-[#064b42]
              underline
              underline-offset-4
            "
          >
            Changer de type de compte
          </button>
        </div>

        {/* FORMULAIRE */}

        <div
          className="
            mt-8
            space-y-5
          "
        >
          {/* ROLE */}

          <div>
            <label
              className="
                mb-2
                block
                text-sm
                font-black
                text-[#064b42]
              "
            >
              Type de compte
            </label>

            <select
              className="input"
              value={role}
              onChange={(event) => {
                const nextRole =
                  event.target
                    .value as UserRole;

                setRole(
                  nextRole
                );

                setOrganizationName(
                  ""
                );

                setLogoFile(
                  null
                );
              }}
            >
              <option value="adoptant">
                Adoptant
              </option>

              <option value="association">
                Association
              </option>

              <option value="refuge">
                Refuge / SIGFA
              </option>

              <option value="benevole">
                Bénévole indépendant
              </option>

              <option value="fourriere">
                Fourrière
              </option>
            </select>
          </div>

          {/* NOM */}

          <input
            className="input"
            placeholder={
              role === "adoptant"
                ? "Nom complet"
                : "Nom complet du responsable"
            }
            value={fullName}
            onChange={(event) =>
              setFullName(
                event.target.value
              )
            }
          />

          {/* STRUCTURE */}

          {isOrganization && (
            <input
              className="input"
              placeholder={
                organizationPlaceholder
              }
              value={
                organizationName
              }
              onChange={(event) =>
                setOrganizationName(
                  event.target.value
                )
              }
            />
          )}

          {/* LOGO / PHOTO */}

          {canUploadAvatar && (
            <div
              className="
                rounded-[26px]
                bg-white
                p-5
                shadow
              "
            >
              <h2
                className="
                  text-xl
                  font-black
                  text-[#064b42]
                "
              >
                {isOrganization
                  ? "Logo de la structure"
                  : "Photo du bénévole"}
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                Cette image pourra être
                affichée sur les fiches
                des animaux que vous
                créez.
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setLogoFile(
                    event.target
                      .files?.[0] ||
                      null
                  )
                }
                className="
                  mt-4
                  w-full
                  rounded-2xl
                  bg-[#f8f4ec]
                  p-4
                "
              />

              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Aperçu"
                  className="
                    mt-5
                    h-32
                    w-32
                    rounded-full
                    border-4
                    border-white
                    object-cover
                    shadow-xl
                  "
                />
              )}
            </div>
          )}

          {/* EMAIL */}

          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
          />

          {/* PASSWORD */}

          <input
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="Mot de passe"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
          />

          {/* TELEPHONE */}

          <input
            className="input"
            type="tel"
            placeholder="Téléphone"
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value
              )
            }
          />

          {/* ILE */}

          <input
            className="input"
            placeholder="Île"
            value={island}
            onChange={(event) =>
              setIsland(
                event.target.value
              )
            }
          />

          {/* COMMUNE */}

          <input
            className="input"
            placeholder="Commune"
            value={city}
            onChange={(event) =>
              setCity(
                event.target.value
              )
            }
          />

          {/* MESSAGE SELON ROLE */}

          {role === "adoptant" ? (
            <div
              className="
                rounded-[22px]
                bg-[#fce8ec]
                p-4
                text-sm
                leading-relaxed
                text-[#76545b]
              "
            >
              Après la création de votre
              compte, vous compléterez
              votre questionnaire
              adoptant.
            </div>
          ) : (
            <div
              className="
                rounded-[22px]
                bg-[#eaf5f1]
                p-4
                text-sm
                leading-relaxed
                text-[#48675e]
              "
            >
              Ce type de compte permet
              de créer et gérer des
              fiches d'animaux sur Taui
              Te Ora.
            </div>
          )}

          {/* SUBMIT */}

          <button
            type="button"
            onClick={register}
            disabled={
              loading ||
              cooldown
            }
            className="
              w-full
              rounded-full
              bg-[#064b42]
              py-4
              text-lg
              font-black
              text-white
              shadow-xl
              transition
              active:scale-[.99]
              disabled:opacity-60
            "
          >
            {loading
              ? "Création..."
              : cooldown
                ? "Merci d'attendre..."
                : `Créer mon compte ${roleLabel}`}
          </button>

          {/* LOGIN */}

          <button
            type="button"
            onClick={() => {
              const destination =
                getDestinationAfterSignup();

              router.push(
                "/login?redirect=" +
                  encodeURIComponent(
                    destination
                  )
              );
            }}
            className="
              w-full
              py-2
              text-sm
              font-bold
              text-[#df8995]
              underline
              underline-offset-4
            "
          >
            J'ai déjà un compte
          </button>
        </div>
      </section>
    </main>
  );
}