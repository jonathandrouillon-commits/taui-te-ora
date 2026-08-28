"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

/* =========================================================
   ROLES
========================================================= */

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

const ROLE_LABELS: Record<
  UserRole,
  string
> = {
  adoptant: "Adoptant",
  association: "Association",
  refuge: "Refuge / SIGFA",
  benevole: "Bénévole indépendant",
  fourriere: "Fourrière",
};

/* =========================================================
   PAYS
========================================================= */

type Country = {
  code: string;
  name: string;
  dial: string;
};

const COUNTRIES: Country[] = [
  {
    code: "PF",
    name: "Polynésie française",
    dial: "+689",
  },
  {
    code: "FR",
    name: "France",
    dial: "+33",
  },
  {
    code: "NZ",
    name: "Nouvelle-Zélande",
    dial: "+64",
  },
  {
    code: "AU",
    name: "Australie",
    dial: "+61",
  },
  {
    code: "US",
    name: "États-Unis",
    dial: "+1",
  },
  {
    code: "CA",
    name: "Canada",
    dial: "+1",
  },
  {
    code: "GB",
    name: "Royaume-Uni",
    dial: "+44",
  },
  {
    code: "BE",
    name: "Belgique",
    dial: "+32",
  },
  {
    code: "CH",
    name: "Suisse",
    dial: "+41",
  },
  {
    code: "DE",
    name: "Allemagne",
    dial: "+49",
  },
  {
    code: "ES",
    name: "Espagne",
    dial: "+34",
  },
  {
    code: "IT",
    name: "Italie",
    dial: "+39",
  },
  {
    code: "PT",
    name: "Portugal",
    dial: "+351",
  },
  {
    code: "NL",
    name: "Pays-Bas",
    dial: "+31",
  },
  {
    code: "LU",
    name: "Luxembourg",
    dial: "+352",
  },
  {
    code: "IE",
    name: "Irlande",
    dial: "+353",
  },
  {
    code: "AT",
    name: "Autriche",
    dial: "+43",
  },
  {
    code: "DK",
    name: "Danemark",
    dial: "+45",
  },
  {
    code: "SE",
    name: "Suède",
    dial: "+46",
  },
  {
    code: "NO",
    name: "Norvège",
    dial: "+47",
  },
  {
    code: "FI",
    name: "Finlande",
    dial: "+358",
  },
  {
    code: "IS",
    name: "Islande",
    dial: "+354",
  },
  {
    code: "GR",
    name: "Grèce",
    dial: "+30",
  },
  {
    code: "PL",
    name: "Pologne",
    dial: "+48",
  },
  {
    code: "CZ",
    name: "République tchèque",
    dial: "+420",
  },
  {
    code: "RO",
    name: "Roumanie",
    dial: "+40",
  },
  {
    code: "HR",
    name: "Croatie",
    dial: "+385",
  },
  {
    code: "MX",
    name: "Mexique",
    dial: "+52",
  },
  {
    code: "BR",
    name: "Brésil",
    dial: "+55",
  },
  {
    code: "AR",
    name: "Argentine",
    dial: "+54",
  },
  {
    code: "CL",
    name: "Chili",
    dial: "+56",
  },
  {
    code: "CO",
    name: "Colombie",
    dial: "+57",
  },
  {
    code: "JP",
    name: "Japon",
    dial: "+81",
  },
  {
    code: "KR",
    name: "Corée du Sud",
    dial: "+82",
  },
  {
    code: "SG",
    name: "Singapour",
    dial: "+65",
  },
  {
    code: "TH",
    name: "Thaïlande",
    dial: "+66",
  },
  {
    code: "ID",
    name: "Indonésie",
    dial: "+62",
  },
  {
    code: "PH",
    name: "Philippines",
    dial: "+63",
  },
  {
    code: "IN",
    name: "Inde",
    dial: "+91",
  },
  {
    code: "ZA",
    name: "Afrique du Sud",
    dial: "+27",
  },
  {
    code: "MA",
    name: "Maroc",
    dial: "+212",
  },
  {
    code: "AE",
    name: "Émirats arabes unis",
    dial: "+971",
  },
  {
    code: "NC",
    name: "Nouvelle-Calédonie",
    dial: "+687",
  },
  {
    code: "WF",
    name: "Wallis-et-Futuna",
    dial: "+681",
  },
  {
    code: "RE",
    name: "La Réunion",
    dial: "+262",
  },
  {
    code: "MQ",
    name: "Martinique",
    dial: "+596",
  },
  {
    code: "GP",
    name: "Guadeloupe",
    dial: "+590",
  },
  {
    code: "GF",
    name: "Guyane française",
    dial: "+594",
  },
  {
    code: "OTHER",
    name: "Autre pays",
    dial: "",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] =
    useState<UserRole>("adoptant");

  const [
    redirectAfterAuth,
    setRedirectAfterAuth,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [cooldown, setCooldown] =
    useState(false);

  const [logoFile, setLogoFile] =
    useState<File | null>(null);

  const [
    logoPreview,
    setLogoPreview,
  ] = useState("");

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

  /* =======================================================
     LOCALISATION INTERNATIONALE
  ======================================================= */

  const [
    countryCode,
    setCountryCode,
  ] = useState("PF");

  const [
    customCountry,
    setCustomCountry,
  ] = useState("");

  const [
    dialCode,
    setDialCode,
  ] = useState("+689");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [
    postalCode,
    setPostalCode,
  ] = useState("");

  const [region, setRegion] =
    useState("");

  const [island, setIsland] =
    useState("");

  const [city, setCity] =
    useState("");

  /* =======================================================
     URL ROLE + REDIRECT
  ======================================================= */

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
      window.setTimeout(
        () => setRole(requestedRole as UserRole),
        0
      );
    }

    window.setTimeout(
      () => setRedirectAfterAuth(redirect),
      0
    );
  }, []);

  /* =======================================================
     LOGO PREVIEW
  ======================================================= */

  useEffect(() => {
    if (!logoFile) {
      window.setTimeout(() => setLogoPreview(""), 0);
      return;
    }

    const preview =
      URL.createObjectURL(
        logoFile
      );

    window.setTimeout(
      () => setLogoPreview(preview),
      0
    );

    return () => {
      URL.revokeObjectURL(
        preview
      );
    };
  }, [logoFile]);

  /* =======================================================
     PAYS
  ======================================================= */

  const selectedCountry =
    useMemo(
      () =>
        COUNTRIES.find(
          (country) =>
            country.code ===
            countryCode
        ),
      [countryCode]
    );

  const countryName =
    countryCode === "OTHER"
      ? customCountry.trim()
      : selectedCountry?.name ||
        "";

  const isFrenchPolynesia =
    countryCode === "PF";

  function changeCountry(
    newCode: string
  ) {
    setCountryCode(newCode);

    const country =
      COUNTRIES.find(
        (item) =>
          item.code === newCode
      );

    setDialCode(
      country?.dial || ""
    );

    /*
     * Si on quitte la Polynésie,
     * l'île ne doit plus rester
     * enregistrée.
     */
    if (newCode !== "PF") {
      setIsland("");
    }

    if (
      newCode !== "OTHER"
    ) {
      setCustomCountry("");
    }
  }

  /* =======================================================
     ROLE
  ======================================================= */

  const isOrganization =
    role === "association" ||
    role === "refuge" ||
    role === "fourriere";

  const canPublishAnimals =
    role !== "adoptant";

  const canUploadAvatar =
    canPublishAnimals;

  const roleLabel =
    ROLE_LABELS[role];

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

  /* =======================================================
     DESTINATIONS
  ======================================================= */

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

    return getDefaultDestination(
      role
    );
  }

  /* =======================================================
     TELEPHONE
  ======================================================= */

  function cleanPhoneNumber(
    value: string
  ) {
    return value.replace(
      /[^\d]/g,
      ""
    );
  }

  function getInternationalPhone() {
    const cleanPhone =
      cleanPhoneNumber(phone);

    const cleanDial =
      dialCode
        .replace(
          /[^\d+]/g,
          ""
        )
        .trim();

    if (!cleanPhone) {
      return "";
    }

    if (!cleanDial) {
      return cleanPhone;
    }

    return `${cleanDial}${cleanPhone}`;
  }

  /* =======================================================
     UPLOAD LOGO / PHOTO
  ======================================================= */

  async function uploadLogo() {
    if (
      !logoFile ||
      !canUploadAvatar
    ) {
      return "";
    }

    const safeName =
      logoFile.name
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

  /* =======================================================
     NOTIFICATION ADMIN
  ======================================================= */

  async function notifyAdmin({
    firstName,
    lastName,
    avatarUrl,
    accessToken,
  }: {
    firstName: string;
    lastName: string;
    avatarUrl: string;
    accessToken: string;
  }) {
    try {
      await fetch(
        "/api/send-new-user",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${accessToken}`,
          },

          body: JSON.stringify({
            email:
              email.trim(),

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

            country_code:
              countryCode,

            country:
              countryName,

            phone_country_code:
              dialCode.trim(),

            phone:
              cleanPhoneNumber(
                phone
              ),

            phone_international:
              getInternationalPhone(),

            address:
              address.trim(),

            postal_code:
              postalCode.trim(),

            region:
              region.trim(),

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

  /* =======================================================
     RATE LIMIT
  ======================================================= */

function isRateLimitError(
    error: unknown
  ) {
    const details =
      error &&
      typeof error === "object"
        ? (error as Record<string, unknown>)
        : {};

    const message =
      typeof details.message === "string"
        ? details.message.toLowerCase()
        : error instanceof Error
          ? error.message.toLowerCase()
          : "";

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
  function getRegistrationErrorMessage(
    error: unknown
  ) {
    const details =
      error &&
      typeof error === "object"
        ? (error as Record<
            string,
            unknown
          >)
        : {};

    const rawMessage =
      typeof details.message ===
      "string"
        ? details.message.trim()
        : error instanceof Error
          ? error.message.trim()
          : "";

    const code =
      typeof details.code ===
      "string"
        ? details.code.trim()
        : "";

    const status =
      typeof details.status ===
        "number" ||
      typeof details.status ===
        "string"
        ? String(details.status)
        : "";

    const searchable =
      `${rawMessage} ${code}`
        .toLowerCase();

    if (
      searchable.includes(
        "user_already_exists"
      ) ||
      searchable.includes(
        "already registered"
      ) ||
      searchable.includes(
        "already been registered"
      )
    ) {
      return "Cette adresse e-mail possède déjà un compte. Utilisez la page de connexion ou la fonction « Mot de passe oublié ».";
    }

    if (
      searchable.includes(
        "signup_disabled"
      ) ||
      searchable.includes(
        "signups not allowed"
      )
    ) {
      return "La création de nouveaux comptes est momentanément désactivée dans Supabase.";
    }

    if (
      searchable.includes(
        "invalid api key"
      ) ||
      searchable.includes(
        "apikey"
      ) ||
      status === "401"
    ) {
      return "La connexion à Supabase est invalide. Vérifiez que l'URL et la clé publique appartiennent au même projet.";
    }

    if (
      searchable.includes(
        "database error"
      ) ||
      searchable.includes(
        "unexpected_failure"
      ) ||
      status === "500"
    ) {
      return "Supabase n'a pas pu enregistrer le profil dans la base de données. La configuration de création des profils doit être vérifiée.";
    }

    if (
      rawMessage &&
      rawMessage !== "{}" &&
      rawMessage !==
        "[object Object]"
    ) {
      const technicalDetails =
        [
          code
            ? `code ${code}`
            : "",
          status
            ? `statut ${status}`
            : "",
        ]
          .filter(Boolean)
          .join(", ");

      return technicalDetails
        ? `${rawMessage} (${technicalDetails})`
        : rawMessage;
    }

    const technicalDetails =
      [
        code
          ? `code ${code}`
          : "",
        status
          ? `statut ${status}`
          : "",
      ]
        .filter(Boolean)
        .join(", ");

    return technicalDetails
      ? `Supabase a refusé la création du compte (${technicalDetails}).`
      : "Supabase a refusé la création du compte sans fournir de détail. Vérifiez que cette adresse e-mail n'est pas déjà enregistrée.";
  }

  /* =======================================================
     VALIDATION
  ======================================================= */

  function validateForm() {
    if (
      !fullName.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      alert(
        "Merci de remplir le nom complet, l'email et le mot de passe."
      );

      return false;
    }

    if (
      isOrganization &&
      !organizationName.trim()
    ) {
      alert(
        `Merci d'indiquer ${organizationPlaceholder.toLowerCase()}.`
      );

      return false;
    }

    if (
      password.length < 6
    ) {
      alert(
        "Le mot de passe doit contenir au moins 6 caractères."
      );

      return false;
    }

    /*
     * Pour tous les comptes,
     * on demande désormais le pays.
     */
    if (!countryName) {
      alert(
        "Merci d'indiquer votre pays de résidence."
      );

      return false;
    }

    /*
     * Le téléphone est important
     * pour les demandes d'adoption.
     */
    if (!phone.trim()) {
      alert(
        "Merci d'indiquer votre numéro de téléphone."
      );

      return false;
    }

    if (
      countryCode === "OTHER" &&
      !dialCode.trim()
    ) {
      alert(
        "Merci d'indiquer l'indicatif téléphonique de votre pays."
      );

      return false;
    }

    if (!city.trim()) {
      alert(
        "Merci d'indiquer votre ville ou commune."
      );

      return false;
    }

    /*
     * Île obligatoire uniquement
     * en Polynésie française.
     */
    if (
      isFrenchPolynesia &&
      !island.trim()
    ) {
      alert(
        "Merci d'indiquer votre île."
      );

      return false;
    }

    return true;
  }

  /* =======================================================
     REGISTER
  ======================================================= */

  async function register() {
    try {
      if (cooldown) {
        return;
      }

      setLoading(true);

      if (!validateForm()) {
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

      const phoneClean =
        cleanPhoneNumber(
          phone
        );

      const phoneInternational =
        getInternationalPhone();

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

                /*
                 * LOCALISATION
                 */
                country_code:
                  countryCode,

                country:
                  countryName,

                address:
                  address.trim(),

                postal_code:
                  postalCode.trim(),

                region:
                  region.trim(),

                island:
                  isFrenchPolynesia
                    ? island.trim()
                    : "",

                city:
                  city.trim(),

                /*
                 * TELEPHONE
                 */
                phone_country_code:
                  dialCode.trim(),

                phone:
                  phoneClean,

                phone_international:
                  phoneInternational,

                avatar_url:
                  avatarUrl,

can_publish_animals:
  canPublishAnimals,

approval_status:
  "pending",

is_active:
  true,

is_verified:
  false,

approved_at:
  null,
              },
            },
          }
        );

      if (error) {
        if (
          isRateLimitError(
            error
          )
        ) {
          setCooldown(true);

          alert(
            "Trop de demandes d'inscription ont été envoyées. Merci d'attendre quelques minutes avant de réessayer."
          );

          setTimeout(() => {
            setCooldown(
              false
            );
          }, 60000);

          return;
        }

        throw error;
      }

      if (
        data.user &&
        Array.isArray(
          data.user.identities
        ) &&
        data.user.identities
          .length === 0
      ) {
        alert(
          "Cette adresse e-mail possède déjà un compte. Utilisez la page de connexion ou la fonction « Mot de passe oublié »."
        );

        return;
      }

      if (data.session?.access_token) {
        await notifyAdmin({
          firstName,
          lastName,
          avatarUrl,
          accessToken:
            data.session.access_token,
        });
      } else {
        console.info(
          "Notification admin différée : aucune session Supabase disponible après l'inscription."
        );
      }

      const destination =
        getDestinationAfterSignup();

      const notificationDestination =
        "/notifications/setup?next=" +
        encodeURIComponent(destination);

      if (data.session) {
        alert(
          "Votre compte a été créé. Vous êtes maintenant connecté."
        );

        router.push(notificationDestination);

        router.refresh();

        return;
      }

      alert(
        "Votre compte a été créé avec succès. Connectez-vous pour continuer."
      );

      router.push(
        "/login?redirect=" +
          encodeURIComponent(
            notificationDestination
          )
      );
    } catch (error: unknown) {
      console.error(
        "ERREUR CREATION COMPTE COMPLETE:",
        error
      );

      alert(
        getRegistrationErrorMessage(
          error
        )
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     AFFICHAGE
  ========================================================= */

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

          <p className="mt-2 text-gray-600">
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

        {/* CHANGER PROFIL */}

        <div className="mt-6 flex justify-center">
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

        <div className="mt-8 space-y-5">

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
              onChange={(
                event
              ) => {
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
            onChange={(
              event
            ) =>
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
              onChange={(
                event
              ) =>
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

              <p className="mt-1 text-sm text-gray-500">
                Cette image pourra être affichée sur les fiches des animaux que vous créez.
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={(
                  event
                ) =>
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
                  src={
                    logoPreview
                  }
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
            onChange={(
              event
            ) =>
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
            onChange={(
              event
            ) =>
              setPassword(
                event.target.value
              )
            }
          />

          {/* =================================================
              LOCALISATION
          ================================================== */}

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
              Coordonnées
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Ces informations permettent à Taui Te Ora de gérer également les adoptants vivant hors de Polynésie française.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              {/* PAYS */}

              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  Pays de résidence *
                </span>

                <select
                  className="input"
                  value={
                    countryCode
                  }
                  onChange={(
                    event
                  ) =>
                    changeCountry(
                      event.target.value
                    )
                  }
                >
                  {COUNTRIES.map(
                    (country) => (
                      <option
                        key={
                          country.code
                        }
                        value={
                          country.code
                        }
                      >
                        {country.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              {/* AUTRE PAYS */}

              {countryCode ===
                "OTHER" && (
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Nom du pays *
                  </span>

                  <input
                    className="input"
                    placeholder="Votre pays"
                    value={
                      customCountry
                    }
                    onChange={(
                      event
                    ) =>
                      setCustomCountry(
                        event.target.value
                      )
                    }
                  />
                </label>
              )}

              {/* INDICATIF */}

              <label>
                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  Indicatif *
                </span>

                <input
                  className="input"
                  placeholder="+689"
                  value={
                    dialCode
                  }
                  onChange={(
                    event
                  ) =>
                    setDialCode(
                      event.target.value
                    )
                  }
                />
              </label>

              {/* TELEPHONE */}

              <label>
                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  Téléphone *
                </span>

                <input
                  className="input"
                  type="tel"
                  placeholder="Numéro de téléphone"
                  value={phone}
                  onChange={(
                    event
                  ) =>
                    setPhone(
                      event.target.value
                    )
                  }
                />
              </label>

              {/* APERCU TELEPHONE */}

              {phone.trim() && (
                <div
                  className="
                    sm:col-span-2
                    rounded-2xl
                    bg-[#f7f2eb]
                    px-4
                    py-3
                    text-sm
                    text-[#6d655e]
                  "
                >
                  Numéro international :{" "}
                  <strong className="text-[#064b42]">
                    {getInternationalPhone()}
                  </strong>
                </div>
              )}

              {/* ADRESSE */}

              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  Adresse
                </span>

                <input
                  className="input"
                  placeholder="Adresse"
                  value={
                    address
                  }
                  onChange={(
                    event
                  ) =>
                    setAddress(
                      event.target.value
                    )
                  }
                />
              </label>

              {/* CODE POSTAL */}

              <label>
                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  Code postal
                </span>

                <input
                  className="input"
                  placeholder="Code postal"
                  value={
                    postalCode
                  }
                  onChange={(
                    event
                  ) =>
                    setPostalCode(
                      event.target.value
                    )
                  }
                />
              </label>

              {/* REGION */}

              <label>
                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  Région / Province / État
                </span>

                <input
                  className="input"
                  placeholder={
                    isFrenchPolynesia
                      ? "Archipel / région"
                      : "Région, province ou État"
                  }
                  value={
                    region
                  }
                  onChange={(
                    event
                  ) =>
                    setRegion(
                      event.target.value
                    )
                  }
                />
              </label>

              {/* ILE POLYNESIE */}

              {isFrenchPolynesia && (
                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Île *
                  </span>

                  <input
                    className="input"
                    placeholder="Tahiti, Moorea, Bora Bora..."
                    value={
                      island
                    }
                    onChange={(
                      event
                    ) =>
                      setIsland(
                        event.target.value
                      )
                    }
                  />
                </label>
              )}

              {/* VILLE */}

              <label
                className={
                  isFrenchPolynesia
                    ? ""
                    : "sm:col-span-2"
                }
              >
                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  {isFrenchPolynesia
                    ? "Commune *"
                    : "Ville *"}
                </span>

                <input
                  className="input"
                  placeholder={
                    isFrenchPolynesia
                      ? "Papeete, Punaauia..."
                      : "Ville"
                  }
                  value={city}
                  onChange={(
                    event
                  ) =>
                    setCity(
                      event.target.value
                    )
                  }
                />
              </label>

            </div>
          </div>

          {/* MESSAGE ROLE */}

          {role ===
          "adoptant" ? (
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
              Après la création de votre compte, vous compléterez votre questionnaire adoptant. Les personnes résidant en France ou à l&apos;étranger peuvent également déposer une demande d&apos;adoption.
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
              Ce type de compte permet de créer et gérer des fiches d&apos;animaux sur Taui Te Ora.
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
            J&apos;ai déjà un compte
          </button>

        </div>
      </section>
    </main>
  );
}
