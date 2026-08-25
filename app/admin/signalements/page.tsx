"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Save,
  Search,
  User,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type SignalementStatus =
  | "nouveau"
  | "en_cours"
  | "animal_retrouve"
  | "cloture";

type Signalement = {
  id: string;
  created_at: string;
  user_id: string | null;
  type_signalement: string | null;
  animal_type: string | null;
  animal_name: string | null;
  island: string | null;
  city: string | null;
  address: string | null;
  situation: string | null;
  description: string | null;
  reporter_name: string | null;
  reporter_phone: string | null;
  reporter_email: string | null;
  status: string | null;
};

const STATUS_OPTIONS: {
  value: SignalementStatus;
  label: string;
}[] = [
  {
    value: "nouveau",
    label: "Signalement en attente",
  },
  {
    value: "en_cours",
    label: "Sauvetage en cours",
  },
  {
    value: "animal_retrouve",
    label: "Animal retrouvé",
  },
  {
    value: "cloture",
    label: "Signalement clôturé",
  },
];

function normalizeStatus(
  status: string | null | undefined
): SignalementStatus {
  const value = String(status || "")
    .trim()
    .toLowerCase();

  if (
    value === "en_cours" ||
    value === "sauvetage en cours" ||
    value === "en intervention" ||
    value === "en_intervention" ||
    value === "pris_en_charge"
  ) {
    return "en_cours";
  }

  if (
    value === "animal_retrouve" ||
    value === "animal retrouvé" ||
    value === "animal retrouve"
  ) {
    return "animal_retrouve";
  }

  if (
    value === "cloture" ||
    value === "signalement cloturé" ||
    value === "signalement clôturé" ||
    value === "signalement cloture" ||
    value === "signalement clôture"
  ) {
    return "cloture";
  }

  return "nouveau";
}

function statusLabel(
  status: string | null | undefined
) {
  const normalized =
    normalizeStatus(status);

  return (
    STATUS_OPTIONS.find(
      (item) =>
        item.value ===
        normalized
    )?.label ||
    "Signalement en attente"
  );
}

function statusClasses(
  status: string | null | undefined
) {
  const normalized =
    normalizeStatus(status);

  switch (
    normalized
  ) {
    case "en_cours":
      return {
        badge:
          "bg-orange-100 text-orange-800 border-orange-200",
        card:
          "border-orange-200",
        select:
          "border-orange-300 bg-orange-50 text-orange-800",
      };

    case "animal_retrouve":
      return {
        badge:
          "bg-green-100 text-green-800 border-green-200",
        card:
          "border-green-200",
        select:
          "border-green-300 bg-green-50 text-green-800",
      };

    case "cloture":
      return {
        badge:
          "bg-[#064b42] text-white border-[#064b42]",
        card:
          "border-[#064b42]/30",
        select:
          "border-[#064b42] bg-[#064b42] text-white",
      };

    default:
      return {
        badge:
          "bg-amber-50 text-amber-800 border-amber-200",
        card:
          "border-amber-100",
        select:
          "border-amber-200 bg-amber-50 text-amber-800",
      };
  }
}

export default function AdminSignalementsPage() {
  const router =
    useRouter();

  const [
    signalements,
    setSignalements,
  ] =
    useState<
      Signalement[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("");

  const [
    savingId,
    setSavingId,
  ] =
    useState<
      string | null
    >(null);

  const [
    selectedStatuses,
    setSelectedStatuses,
  ] =
    useState<
      Record<
        string,
        SignalementStatus
      >
    >({});

  const [
    reporterMessages,
    setReporterMessages,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});

  useEffect(() => {
    void loadSignalements();
  }, []);

  async function loadSignalements() {
    try {
      setLoading(true);

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.replace(
          "/login?redirect=/admin/signalements"
        );
        return;
      }

      const {
        data: profile,
        error:
          profileError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            "role"
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

      if (
        String(
          profile?.role ||
            ""
        )
          .toLowerCase()
          .trim() !==
        "admin"
      ) {
        router.replace(
          "/"
        );
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "signalements"
          )
          .select(
            `
              id,
              created_at,
              user_id,
              type_signalement,
              animal_type,
              animal_name,
              island,
              city,
              address,
              situation,
              description,
              reporter_name,
              reporter_phone,
              reporter_email,
              status
            `
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (
        error
      ) {
        throw error;
      }

      const rows =
        (data ||
          []) as Signalement[];

      setSignalements(
        rows
      );

      const nextStatuses: Record<
        string,
        SignalementStatus
      > = {};

      for (
        const item of
        rows
      ) {
        nextStatuses[
          item.id
        ] =
          normalizeStatus(
            item.status
          );
      }

      setSelectedStatuses(
        nextStatuses
      );
    } catch (
      error: any
    ) {
      console.error(
        "Erreur chargement signalements :",
        error
      );

      alert(
        error?.message ||
          "Erreur lors du chargement des signalements."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  const filteredSignalements =
    useMemo(() => {
      if (
        !statusFilter
      ) {
        return signalements;
      }

      return signalements.filter(
        (item) =>
          normalizeStatus(
            item.status
          ) ===
          statusFilter
      );
    }, [
      signalements,
      statusFilter,
    ]);

  const counts =
    useMemo(() => {
      const result = {
        total:
          signalements.length,
        nouveau: 0,
        en_cours: 0,
        animal_retrouve: 0,
        cloture: 0,
      };

      for (
        const item of
        signalements
      ) {
        const status =
          normalizeStatus(
            item.status
          );

        result[
          status
        ] += 1;
      }

      return result;
    }, [
      signalements,
    ]);

  async function notifyReporter(
    item: Signalement,
    nextStatus: SignalementStatus,
    customMessage: string
  ) {
    if (
      !item.user_id
    ) {
      return;
    }

    const label =
      statusLabel(
        nextStatus
      );

    const message =
      customMessage.trim() ||
      `Le statut de votre signalement est maintenant : ${label}.`;

    const {
      error,
    } =
      await supabase
        .from(
          "notifications"
        )
        .insert({
          recipient_id:
            item.user_id,
          signalement_id:
            item.id,
          type:
            "signalement_status",
          title:
            `Mise à jour de votre signalement : ${label}`,
          message,
          is_read:
            false,
        });

    if (
      error
    ) {
      throw new Error(
        `Le statut a été enregistré, mais la notification n'a pas pu être envoyée : ${error.message}`
      );
    }
  }

  async function saveSignalement(
    item: Signalement
  ) {
    try {
      setSavingId(
        item.id
      );

      const nextStatus =
        selectedStatuses[
          item.id
        ] ||
        normalizeStatus(
          item.status
        );

      const message =
        reporterMessages[
          item.id
        ] || "";

      const {
        error,
      } =
        await supabase
          .from(
            "signalements"
          )
          .update({
            status:
              nextStatus,
          })
          .eq(
            "id",
            item.id
          );

      if (
        error
      ) {
        throw error;
      }

      await notifyReporter(
        item,
        nextStatus,
        message
      );

      setSignalements(
        (
          previous
        ) =>
          previous.map(
            (
              signalement
            ) =>
              signalement.id ===
              item.id
                ? {
                    ...signalement,
                    status:
                      nextStatus,
                  }
                : signalement
          )
      );

      setReporterMessages(
        (
          previous
        ) => ({
          ...previous,
          [item.id]:
            "",
        })
      );

      alert(
        item.user_id
          ? "Signalement sauvegardé et utilisateur informé."
          : "Signalement sauvegardé. Aucun profil connecté n'est lié à ce signalement, donc aucune notification in-app n'a été envoyée."
      );
    } catch (
      error: any
    ) {
      console.error(
        "Erreur sauvegarde signalement :",
        error
      );

      alert(
        error?.message ||
          "Erreur lors de la sauvegarde."
      );
    } finally {
      setSavingId(
        null
      );
    }
  }

  return (
    <main
      className="
        min-h-screen
        bg-[#f8f4ec]
        px-5
        pb-16
        pt-24
      "
    >
      <div
        className="
          mx-auto
          max-w-7xl
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h1
              className="
                text-4xl
                font-black
                text-[#064b42]
              "
            >
              🚨 Gestion des signalements
            </h1>

            <p
              className="
                mt-2
                text-gray-500
              "
            >
              Validez le statut, sauvegardez-le et informez le déclarant.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/dashboard"
              )
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-full
              border
              border-[#d8ccc0]
              bg-white
              px-5
              py-3
              font-black
              text-[#064b42]
              shadow-sm
            "
          >
            <ArrowLeft
              size={18}
            />

            Retour admin
          </button>
        </div>

        <section
          className="
            mt-8
            grid
            gap-4
            sm:grid-cols-2
            lg:grid-cols-5
          "
        >
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
              counts.nouveau
            }
            className="border-amber-200 bg-amber-50"
          />

          <Stat
            label="En cours"
            value={
              counts.en_cours
            }
            className="border-orange-200 bg-orange-50"
          />

          <Stat
            label="Animal retrouvé"
            value={
              counts.animal_retrouve
            }
            className="border-green-200 bg-green-50"
          />

          <Stat
            label="Clôturé"
            value={
              counts.cloture
            }
            className="border-[#064b42] bg-[#064b42] text-white"
          />
        </section>

        <section
          className="
            mt-8
            rounded-[2rem]
            bg-white
            p-6
            shadow-lg
          "
        >
          <div
            className="
              flex
              flex-wrap
              items-end
              gap-4
            "
          >
            <div
              className="
                min-w-[240px]
                flex-1
              "
            >
              <label
                className="
                  mb-2
                  block
                  font-bold
                  text-[#064b42]
                "
              >
                Filtrer par statut
              </label>

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="
                  w-full
                  rounded-2xl
                  border
                  border-[#eadfce]
                  bg-[#faf7f2]
                  px-4
                  py-3
                "
              >
                <option
                  value=""
                >
                  Tous les signalements
                </option>

                {STATUS_OPTIONS.map(
                  (
                    status
                  ) => (
                    <option
                      key={
                        status.value
                      }
                      value={
                        status.value
                      }
                    >
                      {
                        status.label
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  ""
                )
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-full
                bg-[#064b42]
                px-6
                py-3
                font-black
                text-white
              "
            >
              <Search
                size={18}
              />

              Tout afficher
            </button>
          </div>
        </section>

        <section
          className="
            mt-8
          "
        >
          {loading ? (
            <div
              className="
                rounded-[2rem]
                bg-white
                p-8
                text-center
                shadow
              "
            >
              Chargement...
            </div>
          ) : filteredSignalements.length ===
            0 ? (
            <div
              className="
                rounded-[2rem]
                bg-white
                p-8
                text-center
                shadow
              "
            >
              Aucun signalement trouvé.
            </div>
          ) : (
            <div
              className="
                grid
                gap-5
              "
            >
              {filteredSignalements.map(
                (
                  item
                ) => {
                  const currentStatus =
                    selectedStatuses[
                      item.id
                    ] ||
                    normalizeStatus(
                      item.status
                    );

                  const colors =
                    statusClasses(
                      currentStatus
                    );

                  return (
                    <article
                      key={
                        item.id
                      }
                      className={`
                        rounded-[2rem]
                        border-2
                        bg-white
                        p-6
                        shadow-lg
                        ${colors.card}
                      `}
                    >
                      <div
                        className="
                          flex
                          flex-col
                          gap-5
                          lg:flex-row
                          lg:items-start
                          lg:justify-between
                        "
                      >
                        <div
                          className="
                            min-w-0
                            flex-1
                          "
                        >
                          <div
                            className="
                              flex
                              flex-wrap
                              items-center
                              gap-3
                            "
                          >
                            <h2
                              className="
                                text-2xl
                                font-black
                                text-[#064b42]
                              "
                            >
                              {item.type_signalement ||
                                "Signalement"}
                            </h2>

                            <span
                              className={`
                                rounded-full
                                border
                                px-3
                                py-1
                                text-xs
                                font-black
                                ${colors.badge}
                              `}
                            >
                              {statusLabel(
                                currentStatus
                              )}
                            </span>
                          </div>

                          <p
                            className="
                              mt-2
                              text-gray-600
                            "
                          >
                            {item.animal_type ||
                              "Animal"}{" "}
                            —{" "}
                            {item.animal_name ||
                              "Nom inconnu"}
                          </p>

                          <p
                            className="
                              mt-3
                              flex
                              items-center
                              gap-2
                              font-bold
                              text-[#b58b5b]
                            "
                          >
                            <MapPin
                              size={17}
                            />

                            {item.city ||
                              "Commune inconnue"}{" "}
                            -{" "}
                            {item.island ||
                              "Île inconnue"}
                          </p>

                          {item.address && (
                            <p
                              className="
                                mt-1
                                text-gray-600
                              "
                            >
                              Adresse :{" "}
                              {
                                item.address
                              }
                            </p>
                          )}
                        </div>

                        <div
                          className="
                            w-full
                            lg:max-w-sm
                          "
                        >
                          <label
                            className="
                              mb-2
                              block
                              font-black
                              text-[#064b42]
                            "
                          >
                            Statut
                          </label>

                          <select
                            value={
                              currentStatus
                            }
                            onChange={(
                              event
                            ) =>
                              setSelectedStatuses(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  [item.id]:
                                    event
                                      .target
                                      .value as SignalementStatus,
                                })
                              )
                            }
                            className={`
                              w-full
                              rounded-2xl
                              border-2
                              px-4
                              py-3
                              font-black
                              outline-none
                              ${colors.select}
                            `}
                          >
                            {STATUS_OPTIONS.map(
                              (
                                status
                              ) => (
                                <option
                                  key={
                                    status.value
                                  }
                                  value={
                                    status.value
                                  }
                                >
                                  {
                                    status.label
                                  }
                                </option>
                              )
                            )}
                          </select>

                          <label
                            className="
                              mb-2
                              mt-4
                              block
                              font-black
                              text-[#064b42]
                            "
                          >
                            Message au déclarant
                          </label>

                          <textarea
                            rows={3}
                            value={
                              reporterMessages[
                                item.id
                              ] ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              setReporterMessages(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  [item.id]:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            placeholder="Optionnel : ajoutez un message. Sans message, le nouveau statut sera envoyé automatiquement."
                            className="
                              w-full
                              resize-none
                              rounded-2xl
                              border
                              border-[#eadfce]
                              bg-[#faf7f2]
                              px-4
                              py-3
                              outline-none
                              focus:border-[#064b42]
                            "
                          />

                          <button
                            type="button"
                            disabled={
                              savingId ===
                              item.id
                            }
                            onClick={() =>
                              saveSignalement(
                                item
                              )
                            }
                            className="
                              mt-4
                              flex
                              w-full
                              items-center
                              justify-center
                              gap-2
                              rounded-2xl
                              bg-[#064b42]
                              px-5
                              py-3.5
                              font-black
                              text-white
                              transition
                              hover:bg-[#08695d]
                              disabled:cursor-not-allowed
                              disabled:opacity-60
                            "
                          >
                            <Save
                              size={18}
                            />

                            {savingId ===
                            item.id
                              ? "Sauvegarde..."
                              : "Sauvegarder le statut"}
                          </button>

                          {!item.user_id && (
                            <p
                              className="
                                mt-2
                                text-xs
                                font-bold
                                text-orange-700
                              "
                            >
                              Ce signalement n'est lié à aucun compte connecté : notification in-app impossible.
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        className="
                          mt-6
                          grid
                          gap-4
                          md:grid-cols-2
                          xl:grid-cols-3
                        "
                      >
                        <Info
                          icon={
                            <Clock3
                              size={17}
                            />
                          }
                          title="Situation"
                          value={
                            item.situation
                          }
                        />

                        <Info
                          icon={
                            <MessageSquareText
                              size={17}
                            />
                          }
                          title="Description"
                          value={
                            item.description
                          }
                        />

                        <Info
                          icon={
                            <User
                              size={17}
                            />
                          }
                          title="Nom du déclarant"
                          value={
                            item.reporter_name
                          }
                        />

                        <Info
                          icon={
                            <Phone
                              size={17}
                            />
                          }
                          title="Téléphone"
                          value={
                            item.reporter_phone
                          }
                        />

                        <Info
                          icon={
                            <Mail
                              size={17}
                            />
                          }
                          title="Email"
                          value={
                            item.reporter_email
                          }
                        />

                        <Info
                          icon={
                            <CheckCircle2
                              size={17}
                            />
                          }
                          title="Date"
                          value={
                            item.created_at
                              ? new Date(
                                  item.created_at
                                ).toLocaleString(
                                  "fr-FR"
                                )
                              : ""
                          }
                        />
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
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
      className={`
        rounded-[24px]
        border
        p-5
        text-center
        shadow-sm
        ${className}
      `}
    >
      <p
        className="
          text-3xl
          font-black
        "
      >
        {value}
      </p>

      <p
        className="
          mt-1
          text-sm
          font-bold
        "
      >
        {label}
      </p>
    </div>
  );
}

function Info({
  icon,
  title,
  value,
}: {
  icon:
    React.ReactNode;
  title: string;
  value:
    | string
    | null
    | undefined;
}) {
  return (
    <div
      className="
        rounded-2xl
        bg-[#faf7f2]
        p-4
      "
    >
      <div
        className="
          flex
          items-center
          gap-2
          text-sm
          font-black
          uppercase
          tracking-wide
          text-[#b58b5b]
        "
      >
        {icon}

        {title}
      </div>

      <p
        className="
          mt-2
          whitespace-pre-line
          text-[#064b42]
        "
      >
        {value ||
          "Non renseigné"}
      </p>
    </div>
  );
}