"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type FormData = {
  experience_animaux: string;

  animaux_chiens_count: number;
  animaux_chats_count: number;
  animaux_autres_count: number;

  enfants_moins_8_count: number;
  enfants_8_14_count: number;
  enfants_15_plus_count: number;

  type_logement: string;
  temps_seul: string;
  rythme_vie: string;

  age_recherche: string;
  taille_recherche: string;
  sexe_recherche: string;

  accepte_handicap: boolean;
  accepte_traitement: boolean;
  accepte_craintif: boolean;
  accepte_education: boolean;
  accepte_accompagnement_discussion: boolean;

  lieu_vie_animal: string;
  accompagne_regulierement: string;
  place_dans_quotidien: string;
  temps_adaptation: string;
  gestion_difficulte: string;

  preference_libre: string;
};

const initialForm: FormData = {
  experience_animaux: "",

  animaux_chiens_count: 0,
  animaux_chats_count: 0,
  animaux_autres_count: 0,

  enfants_moins_8_count: 0,
  enfants_8_14_count: 0,
  enfants_15_plus_count: 0,

  type_logement: "",
  temps_seul: "",
  rythme_vie: "",

  age_recherche: "",
  taille_recherche: "",
  sexe_recherche: "",

  accepte_handicap: false,
  accepte_traitement: false,
  accepte_craintif: false,
  accepte_education: false,
  accepte_accompagnement_discussion: false,

  lieu_vie_animal: "",
  accompagne_regulierement: "",
  place_dans_quotidien: "",
  temps_adaptation: "",
  gestion_difficulte: "",

  preference_libre: "",
};

export default function AdoptantQuestionnairePage() {
  const router = useRouter();

  const [form, setForm] =
    useState<FormData>(initialForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showOptional, setShowOptional] =
    useState(false);

  const loadQuestionnaire = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.replace(
          "/login?redirect=/adoptant/questionnaire"
        );
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from("questionnaires_adoption")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (error) {
        console.error(
          "Erreur chargement questionnaire :",
          error
        );
      }

      if (data) {
        setForm({
          experience_animaux:
            data.proprietaire_animal || "",

          animaux_chiens_count:
            Number(
              data.animaux_chiens_count || 0
            ),

          animaux_chats_count:
            Number(
              data.animaux_chats_count || 0
            ),

          animaux_autres_count:
            Number(
              data.animaux_autres_count || 0
            ),

          enfants_moins_8_count:
            Number(
              data.enfants_moins_8_count || 0
            ),

          enfants_8_14_count:
            Number(
              data.enfants_8_14_count || 0
            ),

          enfants_15_plus_count:
            Number(
              data.enfants_15_plus_count || 0
            ),

          type_logement:
            data.type_logement || "",

          temps_seul:
            data.temps_seul || "",

          rythme_vie:
            data.rythme_vie || "",

          age_recherche:
            data.age_recherche || "",

          taille_recherche:
            data.taille_recherche || "",

          sexe_recherche:
            data.sexe_recherche || "",

          accepte_handicap:
            Boolean(
              data.accepte_handicap
            ),

          accepte_traitement:
            Boolean(
              data.accepte_traitement
            ),

          accepte_craintif:
            Boolean(
              data.accepte_craintif
            ),

          accepte_education:
            Boolean(
              data.accepte_education
            ),

          accepte_accompagnement_discussion:
            Boolean(
              data.accepte_accompagnement_discussion
            ),

          lieu_vie_animal:
            data.lieu_vie_animal || "",

          accompagne_regulierement:
            data.accompagne_regulierement ||
            "",

          place_dans_quotidien:
            data.place_dans_quotidien ||
            "",

          temps_adaptation:
            data.temps_adaptation || "",

          gestion_difficulte:
            data.gestion_difficulte || "",

          preference_libre:
            data.preference_libre || "",
        });

        if (
          data.lieu_vie_animal ||
          data.accompagne_regulierement ||
          data.place_dans_quotidien ||
          data.temps_adaptation ||
          data.gestion_difficulte ||
          data.preference_libre
        ) {
          setShowOptional(true);
        }
      }
    } catch (error) {
      console.error(
        "Erreur questionnaire adoptant :",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    queueMicrotask(() => void loadQuestionnaire());
  }, [loadQuestionnaire]);

  function updateField(
    field: keyof FormData,
    value: any
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function changeCounter(
    field:
      | "animaux_chiens_count"
      | "animaux_chats_count"
      | "animaux_autres_count"
      | "enfants_moins_8_count"
      | "enfants_8_14_count"
      | "enfants_15_plus_count",
    amount: number
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: Math.max(
        0,
        Number(previous[field]) + amount
      ),
    }));
  }

  function questionnaireComplet() {
    return Boolean(
      form.experience_animaux &&
        form.type_logement &&
        form.temps_seul &&
        form.rythme_vie &&
        form.age_recherche &&
        form.taille_recherche &&
        form.sexe_recherche
    );
  }

  async function saveQuestionnaire() {
    if (saving) return;

    if (!questionnaireComplet()) {
      alert(
        "Merci de répondre aux questions principales avant d'enregistrer votre profil."
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push(
          "/login?redirect=/adoptant/questionnaire"
        );
        return;
      }

      const dataToSave = {
        user_id:
          user.id,

        /*
         * On garde aussi les anciens champs
         * pour rester compatible avec le
         * workflow adoption existant.
         */
        proprietaire_animal:
          form.experience_animaux,

        animal_actuel:
          getAnimalCurrentLabel(),

        adoption_pour:
          "Moi / Ma famille",

        enfants:
          getChildrenLabel(),

        jardin:
          getGardenLabel(),

        age_souhaite:
          form.age_recherche,

        sexe_souhaite:
          form.sexe_recherche,

        taille_souhaitee:
          form.taille_recherche,

        activite_souhaitee:
          form.rythme_vie,

        hypoallergenique:
          "Pas de préférence",

        proprete:
          "Pas de préférence",

        besoins_speciaux:
          getSpecialNeedsLabel(),

        race_souhaitee:
          form.preference_libre.trim(),

        animaux_chiens_count:
          form.animaux_chiens_count,

        animaux_chats_count:
          form.animaux_chats_count,

        animaux_autres_count:
          form.animaux_autres_count,

        enfants_moins_8_count:
          form.enfants_moins_8_count,

        enfants_8_14_count:
          form.enfants_8_14_count,

        enfants_15_plus_count:
          form.enfants_15_plus_count,

        type_logement:
          form.type_logement,

        temps_seul:
          form.temps_seul,

        rythme_vie:
          form.rythme_vie,

        age_recherche:
          form.age_recherche,

        taille_recherche:
          form.taille_recherche,

        sexe_recherche:
          form.sexe_recherche,

        accepte_handicap:
          form.accepte_handicap,

        accepte_traitement:
          form.accepte_traitement,

        accepte_craintif:
          form.accepte_craintif,

        accepte_education:
          form.accepte_education,

        accepte_accompagnement_discussion:
          form.accepte_accompagnement_discussion,

        lieu_vie_animal:
          form.lieu_vie_animal || null,

        accompagne_regulierement:
          form.accompagne_regulierement ||
          null,

        place_dans_quotidien:
          form.place_dans_quotidien ||
          null,

        temps_adaptation:
          form.temps_adaptation || null,

        gestion_difficulte:
          form.gestion_difficulte || null,

        preference_libre:
          form.preference_libre.trim() ||
          null,

        updated_at:
          new Date().toISOString(),
      };

      /*
       * 1) Sauvegarde immédiate dans le profil utilisateur.
       */
      const profileData = {
        id: user.id,
        email: user.email || null,

        adopter_experience:
          form.experience_animaux,

        current_animals:
          getAnimalCurrentLabel(),

        adoption_for:
          "Moi / Ma famille",

        children_age:
          getChildrenLabel(),

        garden_type:
          getGardenLabel(),

        ideal_age:
          form.age_recherche,

        ideal_sex:
          form.sexe_recherche,

        ideal_size:
          form.taille_recherche,

        ideal_activity:
          form.rythme_vie,

        ideal_breed:
          form.preference_libre.trim(),

        hypoallergenic:
          "Pas de préférence",

        cleanliness:
          "Pas de préférence",

        special_needs:
          getSpecialNeedsLabel(),

        approval_status:
          "approved",

        is_verified:
          true,

        is_active:
          true,
      };

      const {
        error: profileSaveError,
      } =
        await supabase
          .from("profiles")
          .upsert(
            profileData,
            {
              onConflict: "id",
            }
          );

      if (profileSaveError) {
        throw profileSaveError;
      }

      /*
       * 2) Compatibilité avec le questionnaire historique :
       * si une ligne existe déjà, on la met à jour.
       * On ne crée pas de ligne générique ici si animal_id
       * reste obligatoire dans le schéma actuel.
       */
      const {
        data: existing,
        error: existingError,
      } =
        await supabase
          .from("questionnaires_adoption")
          .select("id")
          .eq("user_id", user.id)
          .order("updated_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (existingError) {
        console.error(
          "Erreur recherche questionnaire historique :",
          existingError
        );
      }

      if (existing?.id) {
        const {
          error: questionnaireUpdateError,
        } =
          await supabase
            .from(
              "questionnaires_adoption"
            )
            .update(dataToSave)
            .eq(
              "id",
              existing.id
            )
            .eq(
              "user_id",
              user.id
            );

        if (
          questionnaireUpdateError
        ) {
          console.error(
            "Erreur mise à jour questionnaire historique :",
            questionnaireUpdateError
          );
        }
      }

      alert(
        "Votre profil adoptant a bien été enregistré."
      );

      router.push(
        "/dashboard"
      );

      router.refresh();
    } catch (error: any) {
      console.error(
        "Erreur sauvegarde profil adoptant :",
        error
      );

      alert(
        error?.message ||
          "Impossible d'enregistrer votre profil adoptant."
      );
    } finally {
      setSaving(false);
    }
  }

  function getAnimalCurrentLabel() {
    const animals: string[] = [];

    if (
      form.animaux_chiens_count > 0
    ) {
      animals.push(
        `${form.animaux_chiens_count} chien(s)`
      );
    }

    if (
      form.animaux_chats_count > 0
    ) {
      animals.push(
        `${form.animaux_chats_count} chat(s)`
      );
    }

    if (
      form.animaux_autres_count > 0
    ) {
      animals.push(
        `${form.animaux_autres_count} autre(s)`
      );
    }

    return animals.length > 0
      ? animals.join(", ")
      : "Aucun";
  }

  function getChildrenLabel() {
    const children: string[] = [];

    if (
      form.enfants_moins_8_count > 0
    ) {
      children.push(
        `${form.enfants_moins_8_count} moins de 8 ans`
      );
    }

    if (
      form.enfants_8_14_count > 0
    ) {
      children.push(
        `${form.enfants_8_14_count} de 8 à 14 ans`
      );
    }

    if (
      form.enfants_15_plus_count > 0
    ) {
      children.push(
        `${form.enfants_15_plus_count} de 15 ans et +`
      );
    }

    return children.length > 0
      ? children.join(", ")
      : "Non";
  }

  function getGardenLabel() {
    const value =
      form.type_logement;

    if (
      value ===
      "Appartement avec jardin"
    ) {
      return "Appartement avec jardin";
    }

    if (
      value ===
      "Maison avec jardin ouvert"
    ) {
      return "Ouvert";
    }

    if (
      value ===
      "Maison avec jardin clôturé"
    ) {
      return "Clôturé";
    }

    if (
      value ===
      "Grand terrain"
    ) {
      return "Grand terrain";
    }

    return "Pas de jardin";
  }

  function getSpecialNeedsLabel() {
    if (
      form.accepte_handicap ||
      form.accepte_traitement ||
      form.accepte_craintif ||
      form.accepte_education ||
      form.accepte_accompagnement_discussion
    ) {
      return "Oui";
    }

    return "Non";
  }

  if (loading) {
    return (
      <main
        className="
          flex
          min-h-[100dvh]
          items-center
          justify-center
          bg-[#f4eee3]
          px-5
        "
      >
        <div
          className="
            rounded-[30px]
            bg-white
            px-8
            py-7
            text-center
            shadow-xl
          "
        >
          <div
            className="
              mx-auto
              h-10
              w-10
              animate-spin
              rounded-full
              border-4
              border-[#efd5d7]
              border-t-[#df8995]
            "
          />

          <p
            className="
              mt-4
              font-black
              text-[#064b42]
            "
          >
            Chargement de votre profil...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="
        min-h-[100dvh]
        bg-[#f4eee3]
        px-4
        py-6
        pb-28
        text-[#064b42]
      "
    >
      <section
        className="
          mx-auto
          max-w-4xl
          rounded-[32px]
          bg-white
          p-5
          shadow-xl
          sm:p-7
          md:p-8
        "
      >
        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="text-center">
          <img
            src="/logo-taui-te-ora.png"
            alt="Taui Te Ora"
            className="
              mx-auto
              h-24
              w-24
              object-contain
            "
          />

          <p
            className="
              mt-2
              text-[10px]
              font-black
              uppercase
              tracking-[0.22em]
              text-[#df8995]
            "
          >
            Trouvons votre meilleur compagnon
          </p>

          <h1
            className="
              mt-3
              text-3xl
              font-black
              md:text-4xl
            "
          >
            Mon profil adoptant
          </h1>

          <p
            className="
              mx-auto
              mt-3
              max-w-xl
              text-sm
              leading-relaxed
              text-gray-600
            "
          >
            Quelques informations simples nous
            permettront de vous présenter les animaux
            les plus compatibles avec votre mode de vie.
          </p>
        </div>

        {/* ===================================================
            1 EXPERIENCE
        ==================================================== */}

        <QuestionSection
          number="1"
          title="Avez-vous déjà eu un animal ?"
        >
          <ChoiceGrid
            options={[
              "Oui, actuellement",
              "Oui, auparavant",
              "Non, ce sera mon premier",
            ]}
            value={
              form.experience_animaux
            }
            onChange={(value) =>
              updateField(
                "experience_animaux",
                value
              )
            }
          />
        </QuestionSection>

        {/* ===================================================
            2 ANIMAUX
        ==================================================== */}

        <QuestionSection
          number="2"
          title="Quels animaux vivent actuellement avec vous ?"
          subtitle="Indiquez simplement combien."
        >
          <CounterRow
            icon="🐶"
            label="Chien(s)"
            value={
              form.animaux_chiens_count
            }
            onMinus={() =>
              changeCounter(
                "animaux_chiens_count",
                -1
              )
            }
            onPlus={() =>
              changeCounter(
                "animaux_chiens_count",
                1
              )
            }
          />

          <CounterRow
            icon="🐱"
            label="Chat(s)"
            value={
              form.animaux_chats_count
            }
            onMinus={() =>
              changeCounter(
                "animaux_chats_count",
                -1
              )
            }
            onPlus={() =>
              changeCounter(
                "animaux_chats_count",
                1
              )
            }
          />

          <CounterRow
            icon="🐾"
            label="Autre(s)"
            value={
              form.animaux_autres_count
            }
            onMinus={() =>
              changeCounter(
                "animaux_autres_count",
                -1
              )
            }
            onPlus={() =>
              changeCounter(
                "animaux_autres_count",
                1
              )
            }
          />
        </QuestionSection>

        {/* ===================================================
            3 ENFANTS
        ==================================================== */}

        <QuestionSection
          number="3"
          title="Y a-t-il des enfants dans votre foyer ?"
          subtitle="Vous pouvez indiquer plusieurs tranches d'âge."
        >
          <CounterRow
            icon="👶"
            label="Moins de 8 ans"
            value={
              form.enfants_moins_8_count
            }
            onMinus={() =>
              changeCounter(
                "enfants_moins_8_count",
                -1
              )
            }
            onPlus={() =>
              changeCounter(
                "enfants_moins_8_count",
                1
              )
            }
          />

          <CounterRow
            icon="🧒"
            label="8 à 14 ans"
            value={
              form.enfants_8_14_count
            }
            onMinus={() =>
              changeCounter(
                "enfants_8_14_count",
                -1
              )
            }
            onPlus={() =>
              changeCounter(
                "enfants_8_14_count",
                1
              )
            }
          />

          <CounterRow
            icon="🧑"
            label="15 ans et +"
            value={
              form.enfants_15_plus_count
            }
            onMinus={() =>
              changeCounter(
                "enfants_15_plus_count",
                -1
              )
            }
            onPlus={() =>
              changeCounter(
                "enfants_15_plus_count",
                1
              )
            }
          />
        </QuestionSection>

        {/* ===================================================
            4 LOGEMENT
        ==================================================== */}

        <QuestionSection
          number="4"
          title="Quel est votre environnement de vie ?"
        >
          <ChoiceGrid
            options={[
              "Appartement",
              "Appartement avec jardin",
              "Maison sans jardin",
              "Maison avec jardin ouvert",
              "Maison avec jardin clôturé",
              "Grand terrain",
            ]}
            value={
              form.type_logement
            }
            onChange={(value) =>
              updateField(
                "type_logement",
                value
              )
            }
          />
        </QuestionSection>

        {/* ===================================================
            5 TEMPS SEUL
        ==================================================== */}

        <QuestionSection
          number="5"
          title="Combien de temps l'animal sera-t-il généralement seul par jour ?"
        >
          <ChoiceGrid
            options={[
              "Rarement",
              "1–4 h",
              "4–6 h",
              "6–8 h",
              "Plus de 8 h",
            ]}
            value={
              form.temps_seul
            }
            onChange={(value) =>
              updateField(
                "temps_seul",
                value
              )
            }
          />
        </QuestionSection>

        {/* ===================================================
            6 RYTHME
        ==================================================== */}

        <QuestionSection
          number="6"
          title="Quel rythme de vie souhaitez-vous partager avec lui ?"
        >
          <ChoiceGrid
            options={[
              "Très calme",
              "Balades tranquilles",
              "Actif",
              "Très actif / sportif",
            ]}
            value={
              form.rythme_vie
            }
            onChange={(value) =>
              updateField(
                "rythme_vie",
                value
              )
            }
          />
        </QuestionSection>

        {/* ===================================================
            7 AGE
        ==================================================== */}

        <QuestionSection
          number="7"
          title="Quel âge recherchez-vous ?"
        >
          <ChoiceGrid
            options={[
              "Chiot / chaton",
              "Jeune",
              "Adulte",
              "Senior",
              "Peu importe",
            ]}
            value={
              form.age_recherche
            }
            onChange={(value) =>
              updateField(
                "age_recherche",
                value
              )
            }
          />
        </QuestionSection>

        {/* ===================================================
            8 TAILLE
        ==================================================== */}

        <QuestionSection
          number="8"
          title="Quelle taille recherchez-vous ?"
        >
          <ChoiceGrid
            options={[
              "Petit",
              "Moyen",
              "Grand",
              "Très grand",
              "Peu importe",
            ]}
            value={
              form.taille_recherche
            }
            onChange={(value) =>
              updateField(
                "taille_recherche",
                value
              )
            }
          />
        </QuestionSection>

        {/* ===================================================
            9 SEXE
        ==================================================== */}

        <QuestionSection
          number="9"
          title="Avez-vous une préférence de sexe ?"
        >
          <ChoiceGrid
            options={[
              "Mâle",
              "Femelle",
              "Peu importe",
            ]}
            value={
              form.sexe_recherche
            }
            onChange={(value) =>
              updateField(
                "sexe_recherche",
                value
              )
            }
          />
        </QuestionSection>

        {/* ===================================================
            10 ACCOMPAGNEMENT
        ==================================================== */}

        <QuestionSection
          number="10"
          title="Êtes-vous prêt à accueillir un animal nécessitant davantage d'accompagnement ?"
          subtitle="Vous pouvez sélectionner plusieurs réponses."
        >
          <CheckChoice
            checked={
              form.accepte_handicap
            }
            label="Handicap"
            onChange={(checked) =>
              updateField(
                "accepte_handicap",
                checked
              )
            }
          />

          <CheckChoice
            checked={
              form.accepte_traitement
            }
            label="Traitement médical régulier"
            onChange={(checked) =>
              updateField(
                "accepte_traitement",
                checked
              )
            }
          />

          <CheckChoice
            checked={
              form.accepte_craintif
            }
            label="Animal craintif / traumatisé"
            onChange={(checked) =>
              updateField(
                "accepte_craintif",
                checked
              )
            }
          />

          <CheckChoice
            checked={
              form.accepte_education
            }
            label="Éducation à poursuivre"
            onChange={(checked) =>
              updateField(
                "accepte_education",
                checked
              )
            }
          />

          <CheckChoice
            checked={
              form.accepte_accompagnement_discussion
            }
            label="Je suis ouvert à en discuter"
            onChange={(checked) =>
              updateField(
                "accepte_accompagnement_discussion",
                checked
              )
            }
          />
        </QuestionSection>

        {/* ===================================================
            FACULTATIF
        ==================================================== */}

        <div
          className="
            mt-8
            rounded-[26px]
            border
            border-[#eadfd8]
            bg-[#fffaf7]
            p-4
            sm:p-5
          "
        >
          <button
            type="button"
            onClick={() =>
              setShowOptional(
                !showOptional
              )
            }
            className="
              flex
              w-full
              items-center
              justify-between
              gap-4
              text-left
            "
          >
            <div>
              <p
                className="
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-[#df8995]
                "
              >
                Facultatif
              </p>

              <h2
                className="
                  mt-1
                  text-lg
                  font-black
                  text-[#064b42]
                "
              >
                Affiner mon profil
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-gray-500
                "
              >
                Quelques réponses supplémentaires
                peuvent améliorer la précision de vos matchs.
              </p>
            </div>

            <span
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-white
                text-xl
                font-black
                shadow-sm
              "
            >
              {showOptional
                ? "−"
                : "+"}
            </span>
          </button>

          {showOptional && (
            <div className="mt-5 space-y-6">
              <OptionalQuestion
                title="Où l'animal vivra-t-il principalement ?"
                options={[
                  "À l'intérieur",
                  "Intérieur et extérieur",
                  "Principalement à l'extérieur",
                ]}
                value={
                  form.lieu_vie_animal
                }
                onChange={(value) =>
                  updateField(
                    "lieu_vie_animal",
                    value
                  )
                }
              />

              <OptionalQuestion
                title="L'animal pourra-t-il vous accompagner régulièrement ?"
                options={[
                  "Oui, souvent",
                  "Parfois",
                  "Rarement",
                  "Non",
                ]}
                value={
                  form.accompagne_regulierement
                }
                onChange={(value) =>
                  updateField(
                    "accompagne_regulierement",
                    value
                  )
                }
              />

              <OptionalQuestion
                title="Quelle place souhaitez-vous donner à votre animal dans votre quotidien ?"
                options={[
                  "Un véritable membre de la famille",
                  "Un compagnon présent au quotidien",
                  "Un compagnon plutôt indépendant",
                ]}
                value={
                  form.place_dans_quotidien
                }
                onChange={(value) =>
                  updateField(
                    "place_dans_quotidien",
                    value
                  )
                }
              />

              <OptionalQuestion
                title="Êtes-vous prêt à consacrer du temps à son adaptation ?"
                options={[
                  "Oui, autant que nécessaire",
                  "Oui, raisonnablement",
                  "Je recherche plutôt un animal déjà autonome",
                ]}
                value={
                  form.temps_adaptation
                }
                onChange={(value) =>
                  updateField(
                    "temps_adaptation",
                    value
                  )
                }
              />

              <OptionalQuestion
                title="En cas de difficulté comportementale, que seriez-vous prêt à faire ?"
                options={[
                  "Prendre le temps de travailler avec lui",
                  "Faire appel à un éducateur",
                  "Les deux",
                  "Je préfère un animal sans difficulté particulière",
                ]}
                value={
                  form.gestion_difficulte
                }
                onChange={(value) =>
                  updateField(
                    "gestion_difficulte",
                    value
                  )
                }
              />

              <label className="block">
                <span
                  className="
                    mb-2
                    block
                    text-sm
                    font-black
                    text-[#064b42]
                  "
                >
                  Avez-vous une préférence particulière ?
                </span>

                <textarea
                  rows={4}
                  value={
                    form.preference_libre
                  }
                  onChange={(event) =>
                    updateField(
                      "preference_libre",
                      event.target.value
                    )
                  }
                  placeholder="Caractère, type d'animal, préférence particulière..."
                  className="
                    w-full
                    resize-none
                    rounded-[20px]
                    border
                    border-[#ded4c5]
                    bg-white
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-[#064b42]
                    focus:ring-2
                    focus:ring-[#064b42]/20
                  "
                />
              </label>
            </div>
          )}
        </div>

        {/* ===================================================
            SAVE
        ==================================================== */}

        <div
          className="
            mt-8
            flex
            flex-col-reverse
            gap-3
            sm:flex-row
            sm:justify-between
          "
        >
          <button
            type="button"
            onClick={() =>
              router.back()
            }
            disabled={
              saving
            }
            className="
              rounded-full
              bg-gray-100
              px-6
              py-4
              font-black
              text-gray-700
              disabled:opacity-60
            "
          >
            Retour
          </button>

          <button
            type="button"
            onClick={
              saveQuestionnaire
            }
            disabled={
              saving
            }
            className="
              rounded-full
              bg-[#064b42]
              px-7
              py-4
              font-black
              text-white
              shadow-lg
              disabled:opacity-60
            "
          >
            {saving
              ? "Enregistrement..."
              : "Enregistrer mon profil"}
          </button>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function QuestionSection({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="
        mt-7
        rounded-[26px]
        border
        border-[#eee3dc]
        bg-[#fffaf7]
        p-4
        sm:p-5
      "
    >
      <div className="flex gap-3">
        <div
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-[#ef8196]
            text-sm
            font-black
            text-white
          "
        >
          {number}
        </div>

        <div>
          <h2
            className="
              text-base
              font-black
              text-[#064b42]
              sm:text-lg
            "
          >
            {title}
          </h2>

          {subtitle && (
            <p
              className="
                mt-1
                text-xs
                text-gray-500
              "
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {children}
      </div>
    </section>
  );
}

function ChoiceGrid({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div
      className="
        grid
        grid-cols-1
        gap-2
        sm:grid-cols-2
      "
    >
      {options.map(
        (option) => {
          const selected =
            value === option;

          return (
            <button
              key={
                option
              }
              type="button"
              onClick={() =>
                onChange(option)
              }
              className={`
                rounded-[18px]
                border-2
                px-4
                py-3
                text-left
                text-sm
                font-bold
                transition
                active:scale-[.99]
                ${
                  selected
                    ? "border-[#ef8196] bg-[#fff0f2] text-[#d96f81]"
                    : "border-[#eee3dc] bg-white text-[#5d5955]"
                }
              `}
            >
              {selected && (
                <span className="mr-2">
                  ✓
                </span>
              )}

              {option}
            </button>
          );
        }
      )}
    </div>
  );
}

function CounterRow({
  icon,
  label,
  value,
  onMinus,
  onPlus,
}: {
  icon: string;
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        rounded-[18px]
        border
        border-[#eee3dc]
        bg-white
        px-4
        py-3
      "
    >
      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <span className="text-2xl">
          {icon}
        </span>

        <span
          className="
            text-sm
            font-black
            text-[#5d5955]
          "
        >
          {label}
        </span>
      </div>

      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <button
          type="button"
          onClick={
            onMinus
          }
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-[#f3eee9]
            text-xl
            font-black
            text-[#645e59]
          "
        >
          −
        </button>

        <span
          className="
            min-w-6
            text-center
            text-lg
            font-black
            text-[#064b42]
          "
        >
          {value}
        </span>

        <button
          type="button"
          onClick={
            onPlus
          }
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-[#ef8196]
            text-xl
            font-black
            text-white
          "
        >
          +
        </button>
      </div>
    </div>
  );
}

function CheckChoice({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(
          !checked
        )
      }
      className={`
        flex
        w-full
        items-center
        gap-3
        rounded-[18px]
        border-2
        px-4
        py-3
        text-left
        text-sm
        font-bold
        ${
          checked
            ? "border-[#ef8196] bg-[#fff0f2] text-[#d96f81]"
            : "border-[#eee3dc] bg-white text-[#5d5955]"
        }
      `}
    >
      <span
        className={`
          flex
          h-5
          w-5
          shrink-0
          items-center
          justify-center
          rounded-full
          ${
            checked
              ? "bg-[#ef8196] text-white"
              : "border border-[#d8cec7]"
          }
        `}
      >
        {checked
          ? "✓"
          : ""}
      </span>

      {label}
    </button>
  );
}

function OptionalQuestion({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <p
        className="
          mb-2
          text-sm
          font-black
          text-[#064b42]
        "
      >
        {title}
      </p>

      <ChoiceGrid
        options={
          options
        }
        value={
          value
        }
        onChange={
          onChange
        }
      />
    </div>
  );
}