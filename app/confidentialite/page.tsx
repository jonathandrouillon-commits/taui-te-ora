"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Database,
  Eye,
  FileText,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Server,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";
import { useLanguage } from "../lib/i18n";

const LAST_UPDATED_FR = "9 septembre 2026";
const LAST_UPDATED_EN = "September 9, 2026";

/*
  ============================================================
  INFORMATIONS A VALIDER / MODIFIER AVANT PUBLICATION JURIDIQUE
  ============================================================

  1. DATA_CONTROLLER
     Remplacer par le nom exact de la personne morale responsable
     du traitement des données de TAUI TE ORA.

  2. PRIVACY_EMAIL
     Remplacer par l'adresse email réellement utilisée pour les
     demandes relatives aux données personnelles.

  3. POSTAL_ADDRESS
     Remplacer par l'adresse postale officielle.

  4. RETENTION_TEXT_FR / RETENTION_TEXT_EN
     Les durées définitives de conservation devront être validées.
     Pour le moment, la page indique clairement qu'elles dépendent
     de la finalité et des obligations applicables.
*/

const DATA_CONTROLLER = "Jonathan Drouillon / Fenua Pro Bartender Hospitality Group";
const PRIVACY_EMAIL = "lesveilleursdekali@gmail.com";
const POSTAL_ADDRESS = "BP 42635 FARE TONY, 98713 Papeete, Polynésie française";

const RETENTION_TEXT_FR =
  "Les données sont conservées uniquement pendant la durée nécessaire aux finalités pour lesquelles elles sont traitées, ainsi que pendant les durées imposées par les obligations légales applicables. Les durées détaillées par catégorie de données seront précisées après validation.";
const RETENTION_TEXT_EN =
  "Data is retained only for as long as necessary for the purposes for which it is processed and for any additional period required by applicable legal obligations. Detailed retention periods by data category will be specified after validation.";

export default function ConfidentialitePage() {
  const { language } = useLanguage();
  const en = language === "en";
  const tr = (fr: string, english: string) => (en ? english : fr);

  const sections = [
    {
      icon: <UserRound size={24} />,
      title: tr("1. Responsable du traitement", "1. Data controller"),
      body: (
        <>
          <p>
            {tr(
              "Le responsable du traitement des données personnelles collectées via TAUI TE ORA est :",
              "The controller responsible for personal data collected through TAUI TE ORA is:"
            )}
          </p>
          <LegalValue>{DATA_CONTROLLER}</LegalValue>
          <p className="mt-3">
            <strong>{tr("Adresse :", "Address:")}</strong>{" "}
            {POSTAL_ADDRESS}
          </p>
          <p>
            <strong>{tr("Contact données personnelles :", "Privacy contact:")}</strong>{" "}
            {PRIVACY_EMAIL}
          </p>
        </>
      ),
    },
    {
      icon: <Database size={24} />,
      title: tr(
        "2. Quelles données peuvent être traitées ?",
        "2. What data may be processed?"
      ),
      body: (
        <>
          <p>
            {tr(
              "Selon les services utilisés, TAUI TE ORA peut traiter notamment les catégories de données suivantes :",
              "Depending on the services used, TAUI TE ORA may process the following categories of data:"
            )}
          </p>
          <BulletList
            items={
              en
                ? [
                    "Account and profile information: name, first name, email address, telephone number, profile picture and preferred language.",
                    "Location information provided by the user, such as island and municipality.",
                    "Information related to adoption applications and user preferences.",
                    "Information about animals, including photos, descriptions, identification information and status.",
                    "Reports concerning lost, found, stray, abandoned or endangered animals.",
                    "Foster-family, volunteer and help-network information provided by users.",
                    "SOS requests, walks, events, participation and community interactions.",
                    "Messages exchanged through the platform.",
                    "Notification preferences and technical information required to deliver notifications.",
                    "Technical and security data necessary for operation, authentication and protection of the service.",
                  ]
                : [
                    "Informations de compte et de profil : nom, prénom, adresse email, téléphone, photo de profil et langue préférée.",
                    "Informations de localisation renseignées par l’utilisateur, notamment l’île et la commune.",
                    "Informations liées aux demandes d’adoption et aux préférences de l’utilisateur.",
                    "Informations concernant les animaux, notamment photos, descriptions, identification et statut.",
                    "Signalements concernant des animaux perdus, trouvés, errants, abandonnés ou en danger.",
                    "Informations de famille d’accueil, de bénévolat et de réseau d’aide renseignées par les utilisateurs.",
                    "Demandes SOS, balades, événements, participations et interactions communautaires.",
                    "Messages échangés au sein de la plateforme.",
                    "Préférences de notifications et informations techniques nécessaires à leur fonctionnement.",
                    "Données techniques et de sécurité nécessaires au fonctionnement, à l’authentification et à la protection du service.",
                  ]
            }
          />
        </>
      ),
    },
    {
      icon: <FileText size={24} />,
      title: tr(
        "3. Pourquoi utilisons-nous ces données ?",
        "3. Why do we use this data?"
      ),
      body: (
        <BulletList
          items={
            en
              ? [
                  "Create, authenticate and manage user accounts.",
                  "Enable responsible adoption services and facilitate contact between users and animal-welfare organisations.",
                  "Manage animal profiles and the My Companions service.",
                  "Publish and follow reports, subject to the visibility selected or required by the service.",
                  "Operate foster care, SOS requests and the help network.",
                  "Enable walks, community features and in-app messaging.",
                  "Send requested or relevant service notifications according to user preferences.",
                  "Protect the platform, prevent abuse and maintain service security.",
                  "Respond to requests relating to personal data and user rights.",
                ]
              : [
                  "Créer, authentifier et gérer les comptes utilisateurs.",
                  "Permettre les services d’adoption responsable et faciliter la mise en relation avec les acteurs de la protection animale.",
                  "Gérer les fiches animaux et le service Mes Compagnons.",
                  "Publier et suivre les signalements, selon la visibilité choisie ou nécessaire au service.",
                  "Faire fonctionner les familles d’accueil, les SOS et le réseau d’aide.",
                  "Permettre les balades, fonctions communautaires et la messagerie interne.",
                  "Envoyer les notifications de service demandées ou pertinentes selon les préférences de l’utilisateur.",
                  "Protéger la plateforme, prévenir les abus et assurer la sécurité du service.",
                  "Répondre aux demandes relatives aux données personnelles et aux droits des utilisateurs.",
                ]
          }
        />
      ),
    },
    {
      icon: <Shield size={24} />,
      title: tr(
        "4. Bases juridiques",
        "4. Legal bases"
      ),
      body: (
        <>
          <p>
            {tr(
              "Selon le traitement concerné, TAUI TE ORA s’appuie sur la base juridique appropriée, notamment l’exécution du service demandé par l’utilisateur, son consentement lorsque celui-ci est requis, le respect d’une obligation légale ou un intérêt légitime lié au fonctionnement et à la sécurité de la plateforme.",
              "Depending on the processing activity, TAUI TE ORA relies on the appropriate legal basis, including performance of the service requested by the user, consent where required, compliance with a legal obligation, or a legitimate interest related to the operation and security of the platform."
            )}
          </p>
          <p className="mt-3">
            {tr(
              "La base applicable peut varier selon la fonctionnalité utilisée.",
              "The applicable legal basis may vary depending on the feature used."
            )}
          </p>
        </>
      ),
    },
    {
      icon: <Eye size={24} />,
      title: tr(
        "5. Données publiques et données privées",
        "5. Public and private data"
      ),
      body: (
        <>
          <p>
            {tr(
              "TAUI TE ORA distingue les informations destinées à être visibles par la communauté des informations privées nécessaires au fonctionnement du service.",
              "TAUI TE ORA distinguishes information intended to be visible to the community from private information required to operate the service."
            )}
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <MiniCard
              title={tr("Peut être public", "May be public")}
              text={tr(
                "Par exemple : certaines fiches d’animaux, photos, informations de signalement, événements ou informations qu’un utilisateur choisit de rendre visibles.",
                "For example: certain animal profiles, photos, report information, events or information a user chooses to make visible."
              )}
            />
            <MiniCard
              title={tr("Reste privé", "Remains private")}
              text={tr(
                "Les coordonnées privées, données de compte, échanges privés et informations non destinées à la publication ne doivent pas être affichés publiquement sauf nécessité du service, choix explicite de l’utilisateur ou obligation applicable.",
                "Private contact details, account data, private conversations and information not intended for publication are not displayed publicly unless required for the service, explicitly chosen by the user or required by applicable rules."
              )}
            />
          </div>
          <p className="mt-5 font-bold text-[#064b42]">
            {tr(
              "Un signalement ne signifie pas que toutes les coordonnées de la personne qui signale deviennent publiques.",
              "Submitting a report does not mean that all of the reporter’s contact details become public."
            )}
          </p>
        </>
      ),
    },
    {
      icon: <MessageCircle size={24} />,
      title: tr(
        "6. Messagerie et interactions",
        "6. Messaging and interactions"
      ),
      body: (
        <p>
          {tr(
            "Lorsque la messagerie interne est utilisée, les informations nécessaires à la conversation sont traitées afin de permettre l’échange entre les personnes concernées. Les utilisateurs ne doivent pas publier dans les messages ou espaces publics des données sensibles ou des informations personnelles qui ne sont pas nécessaires à l’objectif de l’échange.",
            "When in-app messaging is used, information necessary for the conversation is processed to enable communication between the relevant people. Users should not publish sensitive data or unnecessary personal information in messages or public areas."
          )}
        </p>
      ),
    },
    {
      icon: <Server size={24} />,
      title: tr(
        "7. Prestataires techniques",
        "7. Technical service providers"
      ),
      body: (
        <>
          <p>
            {tr(
              "TAUI TE ORA s’appuie sur des prestataires techniques nécessaires au fonctionnement de la plateforme. À ce jour, l’architecture du projet utilise notamment :",
              "TAUI TE ORA relies on technical providers necessary for the operation of the platform. The project architecture currently uses in particular:"
            )}
          </p>
          <BulletList
            items={[
              "Supabase — " +
                tr(
                  "base de données, authentification et stockage associés au fonctionnement de la plateforme.",
                  "database, authentication and storage associated with operation of the platform."
                ),
              "Vercel — " +
                tr(
                  "hébergement et déploiement de l’application web.",
                  "hosting and deployment of the web application."
                ),
            ]}
          />
          <p className="mt-3">
            {tr(
              "Cette liste devra être mise à jour si de nouveaux prestataires traitant des données personnelles sont ajoutés.",
              "This list must be updated if new providers processing personal data are added."
            )}
          </p>
        </>
      ),
    },
    {
      icon: <MapPin size={24} />,
      title: tr(
        "8. Transferts et localisation des données",
        "8. Data location and international transfers"
      ),
      body: (
        <p>
          {tr(
            "Certains prestataires techniques peuvent traiter ou héberger des données en dehors de la Polynésie française. Les mécanismes juridiques et garanties applicables aux éventuels transferts internationaux doivent être appréciés en fonction de la configuration réelle des prestataires utilisés par TAUI TE ORA.",
            "Some technical providers may process or host data outside French Polynesia. The legal mechanisms and safeguards applicable to any international transfers must be assessed according to the actual configuration of the providers used by TAUI TE ORA."
          )}
        </p>
      ),
    },
    {
      icon: <Lock size={24} />,
      title: tr(
        "9. Sécurité",
        "9. Security"
      ),
      body: (
        <p>
          {tr(
            "TAUI TE ORA met en œuvre des mesures techniques et organisationnelles destinées à limiter les accès non autorisés, les pertes, les altérations et les divulgations non souhaitées. Aucun système informatique ne pouvant garantir une sécurité absolue, ces mesures sont adaptées et améliorées en fonction de l’évolution de la plateforme et des risques identifiés.",
            "TAUI TE ORA implements technical and organisational measures intended to limit unauthorised access, loss, alteration and unwanted disclosure. As no information system can guarantee absolute security, these measures are adapted and improved as the platform evolves and risks are identified."
          )}
        </p>
      ),
    },
    {
      icon: <Database size={24} />,
      title: tr(
        "10. Durée de conservation",
        "10. Data retention"
      ),
      body: (
        <p>{en ? RETENTION_TEXT_EN : RETENTION_TEXT_FR}</p>
      ),
    },
    {
      icon: <Shield size={24} />,
      title: tr(
        "11. Vos droits",
        "11. Your rights"
      ),
      body: (
        <>
          <p>
            {tr(
              "Dans les conditions prévues par la réglementation applicable, vous pouvez notamment demander l’accès à vos données personnelles, leur rectification ou leur effacement, demander la limitation de certains traitements, vous opposer à certains traitements et exercer, lorsque les conditions sont réunies, votre droit à la portabilité.",
              "Subject to applicable law, you may in particular request access to your personal data, rectification or erasure, restriction of certain processing, object to certain processing and, where the conditions are met, exercise your right to data portability."
            )}
          </p>
          <p className="mt-3">
            {tr(
              "Lorsqu’un traitement repose sur votre consentement, vous pouvez retirer ce consentement pour l’avenir.",
              "Where processing is based on your consent, you may withdraw that consent for the future."
            )}
          </p>
        </>
      ),
    },
    {
      icon: <Trash2 size={24} />,
      title: tr(
        "12. Suppression du compte",
        "12. Account deletion"
      ),
      body: (
        <>
          <p>
            {tr(
              "TAUI TE ORA prévoit un espace permettant à l’utilisateur d’initier la suppression de son compte. Cette fonction sera accessible depuis la gestion des données du profil.",
              "TAUI TE ORA provides an area allowing users to initiate deletion of their account. This feature will be accessible from the profile data-management area."
            )}
          </p>
          <p className="mt-3">
            {tr(
              "La suppression d’un compte n’implique pas nécessairement l’effacement immédiat de toutes les informations lorsqu’une conservation limitée est nécessaire pour respecter une obligation légale, protéger les droits de tiers, prévenir les abus ou conserver certains éléments qui doivent être dissociés du compte.",
              "Deleting an account does not necessarily mean that every item is erased immediately where limited retention is necessary to comply with a legal obligation, protect third-party rights, prevent abuse or retain certain information that must be separated from the account."
            )}
          </p>
        </>
      ),
    },
    {
      icon: <Mail size={24} />,
      title: tr(
        "13. Exercer vos droits",
        "13. Exercising your rights"
      ),
      body: (
        <>
          <p>
            {tr(
              "Pour toute question ou demande concernant vos données personnelles, vous pourrez utiliser l’espace Mes données de votre profil ou contacter :",
              "For any question or request concerning your personal data, you may use the My Data area of your profile or contact:"
            )}
          </p>
          <LegalValue>{PRIVACY_EMAIL}</LegalValue>
          <p className="mt-4">
            {tr(
              "Afin de protéger votre compte, une vérification de votre identité pourra être demandée lorsqu’elle est nécessaire et proportionnée.",
              "To protect your account, verification of your identity may be requested where necessary and proportionate."
            )}
          </p>
        </>
      ),
    },
    {
      icon: <FileText size={24} />,
      title: tr(
        "14. Évolution de cette politique",
        "14. Changes to this policy"
      ),
      body: (
        <p>
          {tr(
            "Cette politique peut évoluer afin de tenir compte des nouvelles fonctionnalités de TAUI TE ORA, de changements techniques ou d’évolutions réglementaires. La date de dernière mise à jour affichée en haut de cette page permet d’identifier la version en vigueur.",
            "This policy may change to reflect new TAUI TE ORA features, technical changes or regulatory developments. The last-updated date displayed at the top of this page identifies the current version."
          )}
        </p>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[#fbf7ef] pb-28 text-[#2f241c]">
      <section className="relative overflow-hidden px-4 pb-12 pt-20 sm:px-6">
        <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#f6c8cf]/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-52 h-72 w-72 rounded-full bg-[#bfe4da]/40 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#eadfd8] bg-white px-4 py-2 text-sm font-black text-[#064b42] shadow-sm"
          >
            <ArrowLeft size={17} />
            {tr("Retour à l'accueil", "Back to home")}
          </Link>

          <div className="mx-auto mt-10 max-w-3xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#eadfd8] bg-white shadow-lg">
              <Shield size={36} className="text-[#064b42]" />
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-[#df8995]">
              TAUI TE ORA
            </p>

            <h1 className="mt-3 text-4xl font-black leading-tight text-[#064b42] sm:text-5xl">
              {tr(
                "Confidentialité & données personnelles",
                "Privacy & personal data"
              )}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#756d67] sm:text-lg">
              {tr(
                "Nous voulons que l'utilisation de vos données soit compréhensible, transparente et limitée à ce qui est utile au fonctionnement de TAUI TE ORA.",
                "We want the use of your data to be understandable, transparent and limited to what is useful for operating TAUI TE ORA."
              )}
            </p>

            <div className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-[#756d67] shadow-sm">
              {tr("Dernière mise à jour : ", "Last updated: ")}
              {en ? LAST_UPDATED_EN : LAST_UPDATED_FR}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-7 rounded-[28px] border border-[#d8e9e3] bg-[#edf7f4] p-5 text-sm leading-6 text-[#064b42]">
            <p className="font-black">
              {tr(
                "Informations de contact",
                "Contact information"
              )}
            </p>
            <p className="mt-2">
              {tr(
                "Les informations d’identification et de contact du responsable du traitement sont renseignées. Les durées détaillées de conservation restent à valider avant de considérer cette politique comme définitivement finalisée.",
                "The controller identification and contact details are now completed. Detailed retention periods still need to be validated before this policy can be considered fully finalised."
              )}
            </p>
          </div>

          <div className="space-y-5">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-[30px] border border-[#eadfd8] bg-white p-6 shadow-sm sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf7f4] text-[#064b42]">
                    {section.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-black text-[#064b42] sm:text-2xl">
                      {section.title}
                    </h2>

                    <div className="mt-4 text-sm leading-7 text-[#756d67] sm:text-base">
                      {section.body}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-[30px] bg-[#064b42] p-7 text-white sm:p-9">
            <div className="flex items-start gap-4">
              <Shield size={30} className="mt-1 shrink-0 text-[#f6c8cf]" />
              <div>
                <h2 className="text-2xl font-black">
                  {tr(
                    "La technologie doit aider, pas remplacer l'humain.",
                    "Technology should help, not replace people."
                  )}
                </h2>
                <p className="mt-3 leading-7 text-white/80">
                  {tr(
                    "TAUI TE ORA utilise la technologie pour centraliser, connecter et faciliter l'action. Les décisions concernant une adoption, une prise en charge ou une situation animale restent des décisions humaines.",
                    "TAUI TE ORA uses technology to centralise information, connect people and facilitate action. Decisions concerning adoption, animal care or an animal situation remain human decisions."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#df8995]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function LegalValue({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-[#df8995] bg-[#fff5f6] px-4 py-3 font-black text-[#704a50]">
      {children}
    </div>
  );
}

function MiniCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f8f4ec] p-4">
      <p className="font-black text-[#064b42]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#756d67]">{text}</p>
    </div>
  );
}
