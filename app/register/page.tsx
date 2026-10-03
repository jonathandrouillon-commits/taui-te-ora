"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "../lib/supabase";

/* =========================================================
   PROFILS
========================================================= */

type ProfileGroup =
  | "user"
  | "vet_association"
  | "refuge_sigfa"
  | "independent_volunteer"
  | "municipality_pound";

type ProfileSubtype =
  | "particulier"
  | "veterinaire"
  | "association"
  | "refuge"
  | "sigfa"
  | "benevole"
  | "commune"
  | "fourriere";

type UserRole =
  | "adoptant"
  | "association"
  | "refuge"
  | "benevole"
  | "fourriere";

const ALLOWED_GROUPS: ProfileGroup[] = [
  "user",
  "vet_association",
  "refuge_sigfa",
  "independent_volunteer",
  "municipality_pound",
];

const INPUT_CLASS =
  "w-full rounded-2xl border border-[#e4cfaa] bg-white px-4 py-4 font-semibold text-[#3b2417] outline-none transition placeholder:text-gray-400 focus:border-[#064b42]";

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
    code: "OTHER",
    name: "Autre pays",
    dial: "",
  },
];

/* =========================================================
   HELPERS PROFIL
========================================================= */

function getDefaultSubtype(
  group: ProfileGroup
): ProfileSubtype {
  switch (group) {
    case "user":
      return "particulier";

    case "vet_association":
      return "association";

    case "refuge_sigfa":
      return "refuge";

    case "independent_volunteer":
      return "benevole";

    case "municipality_pound":
      return "commune";
  }
}

function getTechnicalRole(
  group: ProfileGroup
): UserRole {
  switch (group) {
    case "user":
      return "adoptant";

    case "vet_association":
      return "association";

    case "refuge_sigfa":
      return "refuge";

    case "independent_volunteer":
      return "benevole";

    case "municipality_pound":
      return "fourriere";
  }
}

function getGroupLabel(
  group: ProfileGroup
) {
  switch (group) {
    case "user":
      return "Utilisateur";

    case "vet_association":
      return "Vétérinaire & Association";

    case "refuge_sigfa":
      return "Refuge / SIGFA";

    case "independent_volunteer":
      return "Bénévole indépendant";

    case "municipality_pound":
      return "Commune & Fourrière";
  }
}

function getSubtypeLabel(
  subtype: ProfileSubtype
) {
  switch (subtype) {
    case "particulier":
      return "Utilisateur";

    case "veterinaire":
      return "Vétérinaire";

    case "association":
      return "Association";

    case "refuge":
      return "Refuge";

    case "sigfa":
      return "SIGFA";

    case "benevole":
      return "Bénévole indépendant";

    case "commune":
      return "Commune";

    case "fourriere":
      return "Fourrière";
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function RegisterPage() {
  const router =
    useRouter();

  const [
    profileGroup,
    setProfileGroup,
  ] =
    useState<ProfileGroup>(
      "user"
    );

  const [
    profileSubtype,
    setProfileSubtype,
  ] =
    useState<ProfileSubtype>(
      "particulier"
    );

  const [
    redirectAfterAuth,
    setRedirectAfterAuth,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    cooldown,
    setCooldown,
  ] =
    useState(false);

  const [
    logoFile,
    setLogoFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    logoPreview,
    setLogoPreview,
  ] =
    useState("");

  const [
    fullName,
    setFullName,
  ] =
    useState("");

  const [
    organizationName,
    setOrganizationName,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  /* =======================================================
     LOCALISATION
  ======================================================= */

  const [
    countryCode,
    setCountryCode,
  ] =
    useState("PF");

  const [
    customCountry,
    setCustomCountry,
  ] =
    useState("");

  const [
    dialCode,
    setDialCode,
  ] =
    useState("+689");

  const [
    phone,
    setPhone,
  ] =
    useState("");

  const [
    address,
    setAddress,
  ] =
    useState("");

  const [
    postalCode,
    setPostalCode,
  ] =
    useState("");

  const [
    region,
    setRegion,
  ] =
    useState("");

  const [
    island,
    setIsland,
  ] =
    useState("");

  const [
    city,
    setCity,
  ] =
    useState("");

  /* =======================================================
     PROFIL TECHNIQUE
  ======================================================= */

  const role =
    getTechnicalRole(
      profileGroup
    );

  const roleLabel =
    getSubtypeLabel(
      profileSubtype
    );

  const groupLabel =
    getGroupLabel(
      profileGroup
    );

  const isOrganization =
    [
      "veterinaire",
      "association",
      "refuge",
      "sigfa",
      "commune",
      "fourriere",
    ].includes(
      profileSubtype
    );

  const canPublishAnimals =
    role !== "adoptant";

  const canUploadAvatar =
    canPublishAnimals;

  /* =======================================================
     URL
  ======================================================= */

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const requestedGroup =
      params.get(
        "group"
      );

    const requestedSubtype =
      params.get(
        "subtype"
      );

    const legacyRole =
      params.get(
        "role"
      );

    const redirect =
      params.get(
        "redirect"
      ) || "";

    let nextGroup:
      ProfileGroup =
        "user";

    if (
      requestedGroup &&
      ALLOWED_GROUPS.includes(
        requestedGroup as ProfileGroup
      )
    ) {
      nextGroup =
        requestedGroup as ProfileGroup;
    } else {
      switch (
        legacyRole
      ) {
        case "association":
          nextGroup =
            "vet_association";
          break;

        case "refuge":
          nextGroup =
            "refuge_sigfa";
          break;

        case "benevole":
          nextGroup =
            "independent_volunteer";
          break;

        case "fourriere":
          nextGroup =
            "municipality_pound";
          break;

        case "adoptant":
        default:
          nextGroup =
            "user";
          break;
      }
    }

    let nextSubtype =
      getDefaultSubtype(
        nextGroup
      );

    const allowedSubtypes:
      Record<
        ProfileGroup,
        ProfileSubtype[]
      > = {
        user: [
          "particulier",
        ],

        vet_association: [
          "veterinaire",
          "association",
        ],

        refuge_sigfa: [
          "refuge",
          "sigfa",
        ],

        independent_volunteer: [
          "benevole",
        ],

        municipality_pound: [
          "commune",
          "fourriere",
        ],
      };

    if (
      requestedSubtype &&
      allowedSubtypes[
        nextGroup
      ].includes(
        requestedSubtype as ProfileSubtype
      )
    ) {
      nextSubtype =
        requestedSubtype as ProfileSubtype;
    }

    setProfileGroup(
      nextGroup
    );

    setProfileSubtype(
      nextSubtype
    );

    setRedirectAfterAuth(
      redirect
    );
  }, []);

  /* =======================================================
     LOGO PREVIEW
  ======================================================= */

  useEffect(() => {
    if (
      !logoFile
    ) {
      setLogoPreview(
        ""
      );

      return;
    }

    const preview =
      URL.createObjectURL(
        logoFile
      );

    setLogoPreview(
      preview
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
          (
            country
          ) =>
            country.code ===
            countryCode
        ),
      [countryCode]
    );

  const countryName =
    countryCode ===
    "OTHER"
      ? customCountry.trim()
      : selectedCountry
          ?.name ||
        "";

  const isFrenchPolynesia =
    countryCode ===
    "PF";

  function changeCountry(
    newCode:
      string
  ) {
    setCountryCode(
      newCode
    );

    const country =
      COUNTRIES.find(
        (
          item
        ) =>
          item.code ===
          newCode
      );

    setDialCode(
      country?.dial ||
        ""
    );

    if (
      newCode !==
      "PF"
    ) {
      setIsland(
        ""
      );
    }

    if (
      newCode !==
      "OTHER"
    ) {
      setCustomCountry(
        ""
      );
    }
  }

  /* =======================================================
     CHANGEMENT GROUPE
  ======================================================= */

  function changeProfileGroup(
    newGroup:
      ProfileGroup
  ) {
    setProfileGroup(
      newGroup
    );

    setProfileSubtype(
      getDefaultSubtype(
        newGroup
      )
    );

    setOrganizationName(
      ""
    );

    setLogoFile(
      null
    );
  }

  /* =======================================================
     SOUS-TYPES
  ======================================================= */

  const subtypeOptions =
    useMemo(() => {
      switch (
        profileGroup
      ) {
        case "vet_association":
          return [
            {
              value:
                "veterinaire" as ProfileSubtype,
              label:
                "Vétérinaire",
            },
            {
              value:
                "association" as ProfileSubtype,
              label:
                "Association",
            },
          ];

        case "refuge_sigfa":
          return [
            {
              value:
                "refuge" as ProfileSubtype,
              label:
                "Refuge",
            },
            {
              value:
                "sigfa" as ProfileSubtype,
              label:
                "SIGFA",
            },
          ];

        case "municipality_pound":
          return [
            {
              value:
                "commune" as ProfileSubtype,
              label:
                "Commune",
            },
            {
              value:
                "fourriere" as ProfileSubtype,
              label:
                "Fourrière",
            },
          ];

        default:
          return [];
      }
    }, [
      profileGroup,
    ]);

  const organizationPlaceholder =
    useMemo(() => {
      switch (
        profileSubtype
      ) {
        case "veterinaire":
          return "Nom de la clinique / du cabinet";

        case "association":
          return "Nom de l'association";

        case "refuge":
          return "Nom du refuge";

        case "sigfa":
          return "Nom de la structure SIGFA";

        case "commune":
          return "Nom de la commune";

        case "fourriere":
          return "Nom de la fourrière";

        default:
          return "";
      }
    }, [
      profileSubtype,
    ]);

  /* =======================================================
     DESTINATION
  ======================================================= */

  function getDefaultDestination(
    currentRole:
      UserRole
  ) {
    switch (
      currentRole
    ) {
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
    if (
      role ===
      "adoptant"
    ) {
      if (
        redirectAfterAuth
      ) {
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

    if (
      redirectAfterAuth
    ) {
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
    value:
      string
  ) {
    return value.replace(
      /[^\d]/g,
      ""
    );
  }

  function getInternationalPhone() {
    const cleanPhone =
      cleanPhoneNumber(
        phone
      );

    const cleanDial =
      dialCode
        .replace(
          /[^\d+]/g,
          ""
        )
        .trim();

    if (
      !cleanPhone
    ) {
      return "";
    }

    if (
      !cleanDial
    ) {
      return cleanPhone;
    }

    return `${cleanDial}${cleanPhone}`;
  }

  /* =======================================================
     UPLOAD LOGO
  ======================================================= */

  async function uploadLogo(
    userId:
      string
  ) {
    if (
      !logoFile ||
      !canUploadAvatar
    ) {
      return "";
    }

    const safeName =
      logoFile.name
        .normalize(
          "NFD"
        )
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
      `${folder}/${userId}/${Date.now()}-${safeName}`;

    const {
      error,
    } =
      await supabase.storage
        .from(
          "profiles"
        )
        .upload(
          path,
          logoFile,
          {
            upsert:
              true,
          }
        );

    if (
      error
    ) {
      throw error;
    }

    const {
      data,
    } =
      supabase.storage
        .from(
          "profiles"
        )
        .getPublicUrl(
          path
        );

    return data.publicUrl;
  }

  /* =======================================================
     ADMIN NOTIFICATION
  ======================================================= */

  async function notifyAdmin({
    firstName,
    lastName,
    avatarUrl,
    accessToken,
  }: {
    firstName:
      string;
    lastName:
      string;
    avatarUrl:
      string;
    accessToken:
      string;
  }) {
    try {
      await fetch(
        "/api/send-new-user",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          body:
            JSON.stringify({
              email:
                email.trim(),

              first_name:
                firstName,

              last_name:
                lastName,

              role,

              role_label:
                roleLabel,

              profile_group:
                profileGroup,

              profile_subtype:
                profileSubtype,

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
    } catch (
      error
    ) {
      console.error(
        "ERREUR EMAIL ADMIN:",
        error
      );
    }
  }

  /* =======================================================
     ERREURS
  ======================================================= */

  function isRateLimitError(
    error:
      unknown
  ) {
    const details =
      error &&
      typeof error ===
        "object"
        ? (
            error as Record<
              string,
              unknown
            >
          )
        : {};

    const message =
      typeof details.message ===
      "string"
        ? details.message.toLowerCase()
        : error instanceof Error
          ? error.message.toLowerCase()
          : "";

    return (
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
    error:
      unknown
  ) {
    const details =
      error &&
      typeof error ===
        "object"
        ? (
            error as Record<
              string,
              unknown
            >
          )
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
        ? details.code
        : "";

    const status =
      typeof details.status ===
        "number" ||
      typeof details.status ===
        "string"
        ? String(
            details.status
          )
        : "";

    const searchable =
      `${rawMessage} ${code}`
        .toLowerCase();

    if (
      searchable.includes(
        "already registered"
      ) ||
      searchable.includes(
        "user_already_exists"
      )
    ) {
      return "Cette adresse e-mail possède déjà un compte.";
    }

    if (
      searchable.includes(
        "signup_disabled"
      )
    ) {
      return "La création de compte est momentanément désactivée.";
    }

    if (
      searchable.includes(
        "invalid api key"
      ) ||
      status ===
        "401"
    ) {
      return "La connexion à Supabase est invalide.";
    }

    return (
      rawMessage ||
      "Impossible de créer le compte."
    );
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
      password.length <
      6
    ) {
      alert(
        "Le mot de passe doit contenir au moins 6 caractères."
      );

      return false;
    }

    if (
      isOrganization &&
      !organizationName.trim()
    ) {
      alert(
        `Merci d'indiquer : ${organizationPlaceholder}.`
      );

      return false;
    }

    if (
      !countryName
    ) {
      alert(
        "Merci d'indiquer votre pays."
      );

      return false;
    }

    if (
      !phone.trim()
    ) {
      alert(
        "Merci d'indiquer votre téléphone."
      );

      return false;
    }

    if (
      countryCode ===
        "OTHER" &&
      !dialCode.trim()
    ) {
      alert(
        "Merci d'indiquer l'indicatif téléphonique."
      );

      return false;
    }

    if (
      !city.trim()
    ) {
      alert(
        "Merci d'indiquer votre ville ou commune."
      );

      return false;
    }

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
     INSCRIPTION
  ======================================================= */

  async function register() {
    if (
      cooldown ||
      loading
    ) {
      return;
    }

    try {
      setLoading(
        true
      );

      if (
        !validateForm()
      ) {
        return;
      }

      const nameParts =
        fullName
          .trim()
          .split(
            /\s+/
          );

      const firstName =
        nameParts[0] ||
        "";

      const lastName =
        nameParts
          .slice(1)
          .join(" ");

      const phoneClean =
        cleanPhoneNumber(
          phone
        );

      const phoneInternational =
        getInternationalPhone();

      /*
       * Les 3 niveaux sont enregistrés :
       *
       * role = compatibilité avec le système actuel.
       * profile_group = nouvelle catégorie Taui.
       * profile_subtype = type exact.
       */

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
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

              profile_group:
                profileGroup,

              profile_subtype:
                profileSubtype,

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

              phone_country_code:
                dialCode.trim(),

              phone:
                phoneClean,

              phone_international:
                phoneInternational,

              avatar_url:
                "",

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
        });

      if (
        error
      ) {
        if (
          isRateLimitError(
            error
          )
        ) {
          setCooldown(
            true
          );

          alert(
            "Trop de demandes ont été envoyées. Merci d'attendre quelques minutes."
          );

          window.setTimeout(
            () =>
              setCooldown(
                false
              ),
            60000
          );

          return;
        }

        throw error;
      }

      if (
        !data.user
      ) {
        throw new Error(
          "Le compte n'a pas pu être créé."
        );
      }

      if (
        Array.isArray(
          data.user.identities
        ) &&
        data.user.identities
          .length ===
          0
      ) {
        alert(
          "Cette adresse e-mail possède déjà un compte."
        );

        return;
      }

      let avatarUrl =
        "";

      /*
       * Si Supabase fournit immédiatement une session,
       * on peut uploader le logo/photo puis compléter profiles.
       */

      if (
        data.session
      ) {
        if (
          logoFile &&
          canUploadAvatar
        ) {
          avatarUrl =
            await uploadLogo(
              data.user.id
            );
        }

        const {
          error:
            profileUpdateError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .update({
              first_name:
                firstName,

              last_name:
                lastName,

              email:
                email.trim(),

              phone:
                phoneInternational,

              organization_name:
                isOrganization
                  ? organizationName.trim()
                  : null,

              role,

              profile_group:
                profileGroup,

              profile_subtype:
                profileSubtype,

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
                  : null,

              city:
                city.trim(),

              avatar_url:
                avatarUrl ||
                null,

              can_publish_animals:
                canPublishAnimals,

              approval_status:
                "pending",
            })
            .eq(
              "id",
              data.user.id
            );

        if (
          profileUpdateError
        ) {
          console.error(
            "ERREUR MISE À JOUR PROFIL:",
            profileUpdateError
          );
        }

        /*
         * Met également à jour les métadonnées Auth
         * avec l'avatar définitif.
         */

        const {
          error:
            authUpdateError,
        } =
          await supabase.auth.updateUser({
            data: {
              avatar_url:
                avatarUrl,

              role,

              role_label:
                roleLabel,

              profile_group:
                profileGroup,

              profile_subtype:
                profileSubtype,
            },
          });

        if (
          authUpdateError
        ) {
          console.error(
            "ERREUR METADATA AUTH:",
            authUpdateError
          );
        }

        if (
          data.session
            .access_token
        ) {
          await notifyAdmin({
            firstName,
            lastName,
            avatarUrl,
            accessToken:
              data.session
                .access_token,
          });
        }
      }

      const destination =
        getDestinationAfterSignup();

      const notificationDestination =
        "/notifications/setup?next=" +
        encodeURIComponent(
          destination
        );

      if (
        data.session
      ) {
        alert(
          "Votre compte a été créé. Vous êtes maintenant connecté."
        );

        router.push(
          notificationDestination
        );

        router.refresh();

        return;
      }

      alert(
        "Votre compte a été créé. Vérifiez votre e-mail puis connectez-vous pour continuer."
      );

      router.push(
        "/login?redirect=" +
          encodeURIComponent(
            notificationDestination
          )
      );
    } catch (
      error:
        unknown
    ) {
      console.error(
        "ERREUR CREATION COMPTE:",
        error
      );

      alert(
        getRegistrationErrorMessage(
          error
        )
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-[100dvh] bg-[#f5ead8] px-4 py-6 text-[#3b2417] sm:p-6">

      <section className="mx-auto max-w-4xl rounded-[32px] border border-[#e4cfaa] bg-[#fff3dc] p-5 shadow-2xl sm:p-8">

        {/* HEADER */}

        <div className="text-center">

          <img
            src="/logo-taui-te-ora.png"
            alt="Taui Te Ora"
            className="mx-auto h-28 w-28 object-contain"
          />

          <h1 className="mt-3 text-3xl font-black text-[#064b42] sm:text-5xl">
            Créer un compte
          </h1>

          <p className="mt-2 text-gray-600">
            Profil sélectionné :
          </p>

          <div className="mx-auto mt-3 inline-flex rounded-full bg-[#ef919b] px-5 py-2 text-sm font-black text-white shadow">
            {roleLabel}
          </div>

          <p className="mt-2 text-sm font-bold text-[#6f625a]">
            {groupLabel}
          </p>

        </div>

        <div className="mt-6 flex justify-center">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/choose-role"
              )
            }
            className="text-sm font-bold text-[#064b42] underline underline-offset-4"
          >
            Changer de type de compte
          </button>

        </div>

        <div className="mt-8 space-y-5">

          {/* GROUPE */}

          <label className="block">

            <span className="mb-2 block text-sm font-black text-[#064b42]">
              Type de profil
            </span>

            <select
              className={INPUT_CLASS}
              value={
                profileGroup
              }
              onChange={(
                event
              ) =>
                changeProfileGroup(
                  event.target
                    .value as ProfileGroup
                )
              }
            >
              <option value="user">
                Utilisateur
              </option>

              <option value="vet_association">
                Vétérinaire & Association
              </option>

              <option value="refuge_sigfa">
                Refuge / SIGFA
              </option>

              <option value="independent_volunteer">
                Bénévole indépendant
              </option>

              <option value="municipality_pound">
                Commune & Fourrière
              </option>
            </select>

          </label>

          {/* SOUS-TYPE */}

          {subtypeOptions.length >
            0 && (

            <label className="block">

              <span className="mb-2 block text-sm font-black text-[#064b42]">
                Précisez votre profil
              </span>

              <select
                className={INPUT_CLASS}
                value={
                  profileSubtype
                }
                onChange={(
                  event
                ) => {
                  setProfileSubtype(
                    event.target
                      .value as ProfileSubtype
                  );

                  setOrganizationName(
                    ""
                  );

                  setLogoFile(
                    null
                  );
                }}
              >

                {subtypeOptions.map(
                  (
                    option
                  ) => (

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

          )}

          {/* NOM */}

          <input
            className={INPUT_CLASS}
            placeholder={
              isOrganization
                ? "Nom complet du responsable"
                : "Nom complet"
            }
            value={
              fullName
            }
            onChange={(
              event
            ) =>
              setFullName(
                event.target
                  .value
              )
            }
          />

          {/* STRUCTURE */}

          {isOrganization && (

            <input
              className={INPUT_CLASS}
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
                  event.target
                    .value
                )
              }
            />

          )}

          {/* LOGO */}

          {canUploadAvatar && (

            <div className="rounded-[26px] bg-white p-5 shadow">

              <h2 className="text-xl font-black text-[#064b42]">
                {isOrganization
                  ? "Logo / photo de la structure"
                  : "Photo de profil"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Facultatif. Vous pourrez également l&apos;ajouter plus tard.
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
                className="mt-4 w-full rounded-2xl bg-[#f8f4ec] p-4"
              />

              {logoPreview && (

                <img
                  src={
                    logoPreview
                  }
                  alt="Aperçu"
                  className="mt-5 h-32 w-32 rounded-full border-4 border-white object-cover shadow-xl"
                />

              )}

            </div>

          )}

          {/* EMAIL */}

          <input
            className={INPUT_CLASS}
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={
              email
            }
            onChange={(
              event
            ) =>
              setEmail(
                event.target
                  .value
              )
            }
          />

          {/* PASSWORD */}

          <input
            className={INPUT_CLASS}
            type="password"
            autoComplete="new-password"
            placeholder="Mot de passe"
            value={
              password
            }
            onChange={(
              event
            ) =>
              setPassword(
                event.target
                  .value
              )
            }
          />

          {/* COORDONNEES */}

          <div className="rounded-[26px] bg-white p-5 shadow">

            <h2 className="text-xl font-black text-[#064b42]">
              Coordonnées
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Ces informations permettent notamment de vous contacter concernant les animaux dont vous avez la charge.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              {/* PAYS */}

              <label className="sm:col-span-2">

                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  Pays de résidence *
                </span>

                <select
                  className={INPUT_CLASS}
                  value={
                    countryCode
                  }
                  onChange={(
                    event
                  ) =>
                    changeCountry(
                      event.target
                        .value
                    )
                  }
                >

                  {COUNTRIES.map(
                    (
                      country
                    ) => (

                      <option
                        key={
                          country.code
                        }
                        value={
                          country.code
                        }
                      >
                        {
                          country.name
                        }
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
                    Pays *
                  </span>

                  <input
                    className={INPUT_CLASS}
                    value={
                      customCountry
                    }
                    placeholder="Votre pays"
                    onChange={(
                      event
                    ) =>
                      setCustomCountry(
                        event.target
                          .value
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
                  className={INPUT_CLASS}
                  value={
                    dialCode
                  }
                  placeholder="+689"
                  onChange={(
                    event
                  ) =>
                    setDialCode(
                      event.target
                        .value
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
                  className={INPUT_CLASS}
                  type="tel"
                  value={
                    phone
                  }
                  placeholder="Numéro de téléphone"
                  onChange={(
                    event
                  ) =>
                    setPhone(
                      event.target
                        .value
                    )
                  }
                />

              </label>

              {phone.trim() && (

                <div className="sm:col-span-2 rounded-2xl bg-[#f7f2eb] px-4 py-3 text-sm text-[#6d655e]">

                  Numéro international :{" "}

                  <strong className="text-[#064b42]">
                    {
                      getInternationalPhone()
                    }
                  </strong>

                </div>

              )}

              {/* ADRESSE */}

              <label className="sm:col-span-2">

                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  Adresse
                </span>

                <input
                  className={INPUT_CLASS}
                  value={
                    address
                  }
                  placeholder="Adresse"
                  onChange={(
                    event
                  ) =>
                    setAddress(
                      event.target
                        .value
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
                  className={INPUT_CLASS}
                  value={
                    postalCode
                  }
                  placeholder="Code postal"
                  onChange={(
                    event
                  ) =>
                    setPostalCode(
                      event.target
                        .value
                    )
                  }
                />

              </label>

              {/* REGION */}

              <label>

                <span className="mb-2 block text-sm font-black text-[#064b42]">
                  Région / Archipel
                </span>

                <input
                  className={INPUT_CLASS}
                  value={
                    region
                  }
                  placeholder={
                    isFrenchPolynesia
                      ? "Archipel"
                      : "Région / Province / État"
                  }
                  onChange={(
                    event
                  ) =>
                    setRegion(
                      event.target
                        .value
                    )
                  }
                />

              </label>

              {/* ILE */}

              {isFrenchPolynesia && (

                <label>

                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Île *
                  </span>

                  <input
                    className={INPUT_CLASS}
                    value={
                      island
                    }
                    placeholder="Tahiti, Moorea, Bora Bora..."
                    onChange={(
                      event
                    ) =>
                      setIsland(
                        event.target
                          .value
                      )
                    }
                  />

                </label>

              )}

              {/* COMMUNE */}

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
                  className={INPUT_CLASS}
                  value={
                    city
                  }
                  placeholder={
                    isFrenchPolynesia
                      ? "Papeete, Faa'a, Punaauia..."
                      : "Ville"
                  }
                  onChange={(
                    event
                  ) =>
                    setCity(
                      event.target
                        .value
                    )
                  }
                />

              </label>

            </div>

          </div>

          {/* INFO PROFIL */}

          {profileGroup ===
          "user" ? (

            <div className="rounded-[22px] bg-[#fce8ec] p-4 text-sm leading-relaxed text-[#76545b]">
              Votre compte vous permettra d&apos;enregistrer vos compagnons,
              de participer aux fonctionnalités communautaires et de faire des
              demandes d&apos;adoption.
            </div>

          ) : (

            <div className="rounded-[22px] bg-[#eaf5f1] p-4 text-sm leading-relaxed text-[#48675e]">
              Le profil <strong>{roleLabel}</strong> permet de gérer des
              animaux et d&apos;accéder aux fonctionnalités correspondant à
              votre activité sur Taui Te Ora.
            </div>

          )}

          {/* SUBMIT */}

          <button
            type="button"
            onClick={
              register
            }
            disabled={
              loading ||
              cooldown
            }
            className="w-full rounded-full bg-[#064b42] py-4 text-lg font-black text-white shadow-xl transition active:scale-[.99] disabled:opacity-60"
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
            className="w-full py-2 text-sm font-bold text-[#df8995] underline underline-offset-4"
          >
            J&apos;ai déjà un compte
          </button>

        </div>

      </section>

    </main>
  );
}