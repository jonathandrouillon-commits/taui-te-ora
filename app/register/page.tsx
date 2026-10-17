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

\========================================================= */

type ProfileGroup =

  | "user"

  | "vet_association"

  | "refuge_sigfa"

  | "independent_volunteer"

  | "municipality_pound"

  | "pet_boarding";

type ProfileSubtype =

  | "particulier"

  | "veterinaire"

  | "association"

  | "refuge"

  | "sigfa"

  | "benevole"

  | "commune"

  | "fourriere"

  | "pension";

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

  "pet_boarding",

];

const INPUT_CLASS =

  "w-full rounded-2xl border border-[#e4cfaa] bg-white px-4 py-4 font-semibold text-[#3b2417] outline-none transition placeholder:text-gray-400 focus:border-[#064b42]";

/* =========================================================

   PAYS

\========================================================= */

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



/* Localisation PF : liste d'aide, saisie libre possible pour les cas non répertoriés. */

type IslandEntry = { name: string; archipelago: string; communes: string[] };

const PF_ISLANDS: IslandEntry[] = [

  { name: "Tahiti", archipelago: "Îles du Vent", communes: ["Arue", "Faa'a", "Hitia'a O Te Ra", "Mahina", "Paea", "Papara", "Papeete", "Pirae", "Punaauia", "Taiarapu-Est", "Taiarapu-Ouest", "Teva I Uta"] },

  { name: "Moorea", archipelago: "Îles du Vent", communes: ["Moorea-Maiao"] },

  { name: "Maiao", archipelago: "Îles du Vent", communes: ["Moorea-Maiao"] },

  { name: "Tetiaroa", archipelago: "Îles du Vent", communes: ["Arue"] },

  { name: "Bora Bora", archipelago: "Îles Sous-le-Vent", communes: ["Bora-Bora"] },

  { name: "Raiatea", archipelago: "Îles Sous-le-Vent", communes: ["Taputapuatea", "Tumaraa", "Uturoa"] },

  { name: "Tahaa", archipelago: "Îles Sous-le-Vent", communes: ["Taha'a"] },

  { name: "Huahine", archipelago: "Îles Sous-le-Vent", communes: ["Huahine"] },

  { name: "Maupiti", archipelago: "Îles Sous-le-Vent", communes: ["Maupiti"] },

  { name: "Tupai", archipelago: "Îles Sous-le-Vent", communes: ["Bora-Bora"] },

  { name: "Motu One", archipelago: "Îles Sous-le-Vent", communes: ["Maupiti"] },

  { name: "Rangiroa", archipelago: "Tuamotu", communes: ["Rangiroa"] },

  { name: "Tikehau", archipelago: "Tuamotu", communes: ["Rangiroa"] },

  { name: "Mataiva", archipelago: "Tuamotu", communes: ["Rangiroa"] },

  { name: "Makatea", archipelago: "Tuamotu", communes: ["Rangiroa"] },

  { name: "Fakarava", archipelago: "Tuamotu", communes: ["Fakarava"] },

  { name: "Toau", archipelago: "Tuamotu", communes: ["Fakarava"] },

  { name: "Aratika", archipelago: "Tuamotu", communes: ["Fakarava"] },

  { name: "Kauehi", archipelago: "Tuamotu", communes: ["Fakarava"] },

  { name: "Niau", archipelago: "Tuamotu", communes: ["Fakarava"] },

  { name: "Rotoava", archipelago: "Tuamotu", communes: ["Fakarava"] },

  { name: "Manihi", archipelago: "Tuamotu", communes: ["Manihi"] },

  { name: "Ahe", archipelago: "Tuamotu", communes: ["Manihi"] },

  { name: "Arutua", archipelago: "Tuamotu", communes: ["Arutua"] },

  { name: "Apataki", archipelago: "Tuamotu", communes: ["Arutua"] },

  { name: "Kaukura", archipelago: "Tuamotu", communes: ["Arutua"] },

  { name: "Hao", archipelago: "Tuamotu", communes: ["Hao"] },

  { name: "Amanu", archipelago: "Tuamotu", communes: ["Hao"] },

  { name: "Hereheretue", archipelago: "Tuamotu", communes: ["Hao"] },

  { name: "Makemo", archipelago: "Tuamotu", communes: ["Makemo"] },

  { name: "Anaa", archipelago: "Tuamotu", communes: ["Anaa"] },

  { name: "Faaite", archipelago: "Tuamotu", communes: ["Anaa"] },

  { name: "Takaroa", archipelago: "Tuamotu", communes: ["Takaroa"] },

  { name: "Takapoto", archipelago: "Tuamotu", communes: ["Takaroa"] },

  { name: "Napuka", archipelago: "Tuamotu", communes: ["Napuka"] },

  { name: "Tepoto Nord", archipelago: "Tuamotu", communes: ["Napuka"] },

  { name: "Puka Puka", archipelago: "Tuamotu", communes: ["Puka-Puka"] },

  { name: "Reao", archipelago: "Tuamotu", communes: ["Reao"] },

  { name: "Pukarua", archipelago: "Tuamotu", communes: ["Reao"] },

  { name: "Nukutavake", archipelago: "Tuamotu", communes: ["Nukutavake"] },

  { name: "Tatakoto", archipelago: "Tuamotu", communes: ["Tatakoto"] },

  { name: "Tureia", archipelago: "Tuamotu", communes: ["Tureia"] },

  { name: "Fangatau", archipelago: "Tuamotu", communes: ["Fangatau"] },

  { name: "Fakahina", archipelago: "Tuamotu", communes: ["Fangatau"] },

  { name: "Hikueru", archipelago: "Tuamotu", communes: ["Hikueru"] },

  { name: "Marokau", archipelago: "Tuamotu", communes: ["Hikueru"] },

  { name: "Raroia", archipelago: "Tuamotu", communes: ["Makemo"] },

  { name: "Rurutu", archipelago: "Australes", communes: ["Rurutu"] },

  { name: "Tubuai", archipelago: "Australes", communes: ["Tubuai"] },

  { name: "Raivavae", archipelago: "Australes", communes: ["Raivavae"] },

  { name: "Rimatara", archipelago: "Australes", communes: ["Rimatara"] },

  { name: "Rapa", archipelago: "Australes", communes: ["Rapa"] },

  { name: "Nuku Hiva", archipelago: "Marquises", communes: ["Nuku-Hiva"] },

  { name: "Ua Pou", archipelago: "Marquises", communes: ["Ua-Pou"] },

  { name: "Ua Huka", archipelago: "Marquises", communes: ["Ua-Huka"] },

  { name: "Hiva Oa", archipelago: "Marquises", communes: ["Hiva-Oa"] },

  { name: "Tahuata", archipelago: "Marquises", communes: ["Tahuata"] },

  { name: "Fatu Hiva", archipelago: "Marquises", communes: ["Fatu-Hiva"] },

  { name: "Mangareva", archipelago: "Gambier", communes: ["Gambier"] },

  { name: "Taravai", archipelago: "Gambier", communes: ["Gambier"] },

  { name: "Aukena", archipelago: "Gambier", communes: ["Gambier"] },

  { name: "Akamaru", archipelago: "Gambier", communes: ["Gambier"] },

];

// Codes proposés uniquement quand le rattachement est connu ; saisie libre sinon.

const PF_POSTAL_CODES: Record<string, string[]> = {

  "Papeete": ["98714", "98713"], "Pirae": ["98716"], "Arue": ["98701"],

  "Mahina": ["98709"], "Faa'a": ["98704"], "Punaauia": ["98703"],

  "Paea": ["98711"], "Papara": ["98712"], "Moorea-Maiao": ["98728", "98729"],

  "Bora-Bora": ["98730"], "Uturoa": ["98735"], "Huahine": ["98731"],

  "Taha'a": ["98733"], "Maupiti": ["98732"],

};



/* =========================================================

   HELPERS PROFIL

\========================================================= */

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

    case "pet_boarding":

      return "pension";

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

    case "pet_boarding":

      return "benevole";

  }

}

function getGroupLabel(

  group: ProfileGroup

) {

  switch (group) {

    case "user":

      return "Utilisateur / Adoptant";

    case "vet_association":

      return "Vétérinaire & Association";

    case "refuge_sigfa":

      return "Refuge / SIGFA";

    case "independent_volunteer":

      return "Bénévole";

    case "municipality_pound":

      return "Commune & Fourrière";

    case "pet_boarding":

      return "Pension / Gardiennage";

  }

}

function getSubtypeLabel(

  subtype: ProfileSubtype

) {

  switch (subtype) {

    case "particulier":

      return "Utilisateur / Adoptant";

    case "veterinaire":

      return "Vétérinaire";

    case "association":

      return "Association";

    case "refuge":

      return "Refuge";

    case "sigfa":

      return "SIGFA";

    case "benevole":

      return "Bénévole";

    case "commune":

      return "Commune";

    case "fourriere":

      return "Fourrière";

    case "pension":

      return "Pension / Gardiennage";

  }

}

/* =========================================================

   PAGE

\========================================================= */

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

  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

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

  const [district, setDistrict] = useState("");

  const [customIsland, setCustomIsland] = useState("");

  const [customCity, setCustomCity] = useState("");

  const [customPostalCode, setCustomPostalCode] = useState("");

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

        "pension",

      ].includes(

      profileSubtype

    );

  const canPublishAnimals =

    role !== "adoptant";

  const canUploadAvatar =

    canPublishAnimals || profileGroup === "pet_boarding";

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

            nextGroup = "municipality_pound";

            break;

          case "pension":

            nextGroup = "pet_boarding";

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

        municipality_pound: ["commune", "fourriere"],

        pet_boarding: ["pension"],

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

  const islandEntry = PF_ISLANDS.find((item) => item.name === island);

  const effectiveIsland = island === "__other__" ? customIsland.trim() : island;

  const effectiveCity = city === "__other__" ? customCity.trim() : city;

  const effectivePostalCode = postalCode === "__other__" ? customPostalCode.trim() : postalCode;

  const cityOptions = islandEntry?.communes ?? [];

  const postalOptions = PF_POSTAL_CODES[effectiveCity] ?? [];

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  function changeIsland(value: string) {

    setIsland(value);

    setCustomIsland("");

    setCity("");

    setCustomCity("");

    setPostalCode("");

    setCustomPostalCode("");

    setRegion(PF_ISLANDS.find((item) => item.name === value)?.archipelago ?? "");

  }

  function changeCity(value: string) {

    setCity(value);

    setCustomCity("");

    setPostalCode("");

    setCustomPostalCode("");

  }

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

    if (newCode !== "PF") {

      setIsland(""); setCustomIsland(""); setDistrict("");

      setCity(""); setCustomCity(""); setPostalCode(""); setCustomPostalCode(""); setRegion("");

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

          case "pension":

            return "Nom de la pension / garderie";

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

    if (profileGroup === "pet_boarding") {

      return redirectAfterAuth || "/";

    }

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

                (isFrenchPolynesia && district.trim() ? [address.trim(), `Quartier : ${district.trim()}`].filter(Boolean).join(" - ") : address.trim()),

              postal_code:

                effectivePostalCode.trim(),

              region:

                region.trim(),

              island:

                effectiveIsland.trim(),

              city:

                effectiveCity.trim(),

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

    if (!/[\p{L}]/u.test(firstName.trim()) || !/[\p{L}]/u.test(lastName.trim())) {

      alert("Merci de renseigner séparément votre prénom et votre nom.");

      return false;

    }

    const cleanEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {

      alert("Merci de renseigner une adresse e-mail valide.");

      return false;

    }

    if (!password.trim() || password.length < 6) {

      alert("Le mot de passe doit contenir au moins 6 caractères.");

      return false;

    }

    if (isOrganization && !organizationName.trim()) {

      alert(`Merci d'indiquer : ${organizationPlaceholder}.`);

      return false;

    }

    if (!countryName) {

      alert("Merci d'indiquer votre pays.");

      return false;

    }

    const digits = cleanPhoneNumber(phone);

    if (digits.length < 6 || digits.length > 15) {

      alert("Merci de renseigner un numéro de téléphone valide.");

      return false;

    }

    if (!/^\+?\d{1,4}$/.test(dialCode.trim())) {

      alert("Merci de renseigner un indicatif téléphonique valide.");

      return false;

    }

    if (!effectiveCity.trim()) {

      alert("Merci d'indiquer votre ville ou commune.");

      return false;

    }

    if (isFrenchPolynesia && !effectiveIsland.trim()) {

      alert("Merci d'indiquer votre île.");

      return false;

    }

    if (isFrenchPolynesia && !effectivePostalCode.trim()) {

      alert("Merci de sélectionner ou saisir votre code postal.");

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

                (isFrenchPolynesia && district.trim() ? [address.trim(), `Quartier : ${district.trim()}`].filter(Boolean).join(" - ") : address.trim()),

              postal_code:

                effectivePostalCode.trim(),

              region:

                region.trim(),

              island:

                isFrenchPolynesia

                  ? effectiveIsland.trim()

                  : "",

              city:

                effectiveCity.trim(),

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

                (isFrenchPolynesia && district.trim() ? [address.trim(), `Quartier : ${district.trim()}`].filter(Boolean).join(" - ") : address.trim()),

              postal_code:

                effectivePostalCode.trim(),

              region:

                region.trim(),

              island:

                isFrenchPolynesia

                  ? effectiveIsland.trim()

                  : null,

              city:

                effectiveCity.trim(),

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

        "Votre compte a été créé. Un e-mail de confirmation vous a été envoyé. Cliquez sur le lien reçu avant de vous connecter. Vérifiez également vos courriers indésirables."

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

                      <div>
              <h2 className="mb-2 text-xl font-black text-[#064b42]">Quel est ton profil ?</h2>
              <p className="mb-4 text-sm text-[#6f625a]">Choisis la catégorie qui correspond à ton activité. Tu pourras ensuite préciser ton profil si nécessaire.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  { value: "user", icon: "🐾", title: "Utilisateur / Adoptant", description: "Tu souhaites adopter un animal ? Tu peux aussi simplement enregistrer ton compagnon dans Mes compagnons, participer à la communauté et peut-être craquer un jour pour un autre animal." },
                  { value: "independent_volunteer", icon: "🤝", title: "Bénévole", description: "Tu aides une ou plusieurs associations, participes aux sauvetages, aux transports ou donnes de ton temps pour la cause animale." },
                  { value: "vet_association", icon: "💗", title: "Vétérinaire / Association", description: "Tu es vétérinaire ou tu représentes une association de protection animale. Précise ton activité à l'étape suivante." },
                  { value: "refuge_sigfa", icon: "🏡", title: "Refuge / SIGFA", description: "Tu représentes un refuge ou le SIGFA et participes à la prise en charge et au suivi des animaux." },
                  { value: "pet_boarding", icon: "🐕", title: "Pension / Gardiennage", description: "Tu proposes de l'hébergement, de la garde ou des services de pension pour les animaux." },
                  { value: "municipality_pound", icon: "🏛️", title: "Commune / Fourrière", description: "Tu représentes une commune ou une fourrière impliquée dans la gestion et la protection des animaux." },
                ] as { value: ProfileGroup; icon: string; title: string; description: string }[]).map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={profileGroup === item.value}
                    onClick={() => changeProfileGroup(item.value)}
                    className={`rounded-[22px] border-2 p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#064b42] ${profileGroup === item.value ? "border-[#064b42] bg-[#eaf5f1] shadow-md" : "border-[#e4cfaa] bg-white hover:border-[#df8995]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl" aria-hidden="true">{item.icon}</span>
                      <span className="flex-1 font-black text-[#064b42]">{item.title}</span>
                      <span aria-hidden="true" className="text-xl text-[#064b42]">{profileGroup === item.value ? "●" : "○"}</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[#6f625a]">{item.description}</p>
                  </button>
                ))}
              </div>
            </div>

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

          {/* IDENTITÉ */}

          <div className="grid gap-4 sm:grid-cols-2">

            <label>

              <span className="mb-2 block text-sm font-black text-[#064b42]">Prénom *</span>

              <input className={INPUT_CLASS} autoComplete="given-name" placeholder="Prénom *" value={firstName} onChange={(event) => setFirstName(event.target.value)} />

            </label>

            <label>

              <span className="mb-2 block text-sm font-black text-[#064b42]">Nom *</span>

              <input className={INPUT_CLASS} autoComplete="family-name" placeholder="Nom de famille *" value={lastName} onChange={(event) => setLastName(event.target.value)} />

            </label>

          </div>

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

            placeholder="Email *"

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

                  placeholder="Numéro de téléphone *"

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

              {isFrenchPolynesia ? (

                <>

                  <label className="sm:col-span-2">

                    <span className="mb-2 block text-sm font-black text-[#064b42]">Île *</span>

                    <select className={INPUT_CLASS} value={island} onChange={(event) => changeIsland(event.target.value)}>

                      <option value="">Sélectionner une île</option>

                      {PF_ISLANDS.map((entry) => <option key={entry.name} value={entry.name}>{entry.name} — {entry.archipelago}</option>)}

                      <option value="__other__">Autre île / atoll (saisie libre)</option>

                    </select>

                  </label>

                  {island === "__other__" && (

                    <label className="sm:col-span-2">

                      <span className="mb-2 block text-sm font-black text-[#064b42]">Nom de l'île *</span>

                      <input className={INPUT_CLASS} value={customIsland} onChange={(event) => setCustomIsland(event.target.value)} placeholder="Nom de votre île ou atoll" />

                    </label>

                  )}

                  <label>

                    <span className="mb-2 block text-sm font-black text-[#064b42]">Archipel</span>

                    <input className={INPUT_CLASS} value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Archipel" readOnly={Boolean(islandEntry)} />

                  </label>

                  <label>

                    <span className="mb-2 block text-sm font-black text-[#064b42]">Commune *</span>

                    <select className={INPUT_CLASS} value={city} onChange={(event) => changeCity(event.target.value)} disabled={!island}>

                      <option value="">Sélectionner une commune</option>

                      {cityOptions.map((name) => <option key={name} value={name}>{name}</option>)}

                      <option value="__other__">Autre commune (saisie libre)</option>

                    </select>

                  </label>

                  {city === "__other__" && (

                    <label className="sm:col-span-2">

                      <span className="mb-2 block text-sm font-black text-[#064b42]">Nom de la commune *</span>

                      <input className={INPUT_CLASS} value={customCity} onChange={(event) => setCustomCity(event.target.value)} placeholder="Votre commune" />

                    </label>

                  )}

                  <label>

                    <span className="mb-2 block text-sm font-black text-[#064b42]">Code postal *</span>

                    <select className={INPUT_CLASS} value={postalCode} onChange={(event) => { setPostalCode(event.target.value); setCustomPostalCode(""); }} disabled={!city}>

                      <option value="">Sélectionner un code postal</option>

                      {postalOptions.map((code) => <option key={code} value={code}>{code}</option>)}

                      <option value="__other__">Saisir mon code postal</option>

                    </select>

                  </label>

                  {postalCode === "__other__" && (

                    <label>

                      <span className="mb-2 block text-sm font-black text-[#064b42]">Code postal *</span>

                      <input className={INPUT_CLASS} inputMode="numeric" value={customPostalCode} onChange={(event) => setCustomPostalCode(event.target.value)} placeholder="98700" />

                    </label>

                  )}

                  <label className="sm:col-span-2">

                    <span className="mb-2 block text-sm font-black text-[#064b42]">Quartier / district (facultatif)</span>

                    <input className={INPUT_CLASS} value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="Ex. : Pamatai, Tipaerui, Punaauia PK 18..." />

                    <p className="mt-1 text-xs text-gray-500">Saisie libre pour ne pas exclure les quartiers non répertoriés.</p>

                  </label>

                </>

              ) : (

                <>

                  <label>

                    <span className="mb-2 block text-sm font-black text-[#064b42]">Code postal</span>

                    <input className={INPUT_CLASS} value={postalCode} onChange={(event) => setPostalCode(event.target.value)} placeholder="Code postal" />

                  </label>

                  <label>

                    <span className="mb-2 block text-sm font-black text-[#064b42]">Région / Province / État</span>

                    <input className={INPUT_CLASS} value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Région / Province / État" />

                  </label>

                  <label className="sm:col-span-2">

                    <span className="mb-2 block text-sm font-black text-[#064b42]">Ville *</span>

                    <input className={INPUT_CLASS} value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ville" />

                  </label>

                </>

              )}

            </div>

          </div>

          {/* INFO PROFIL */}

          {profileGroup === "pet_boarding" ? (

            <div className="rounded-[22px] bg-[#eaf5f1] p-4 text-sm leading-relaxed text-[#48675e]">

              Le profil Pension / Gardiennage dispose des mêmes possibilités que Bénévole indépendant,

              selon les règles de validation et de publication de Taui Te Ora.

            </div>

          ) : profileGroup === "user" ? (

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
