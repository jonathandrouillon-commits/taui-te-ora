"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock3,
  PawPrint,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type SterilizationStatus = "oui" | "en_cours" | "non";
type IdentificationType = "puce" | "tatouage";

export default function AjouterCompagnonPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("chien");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState("male");
  const [birthDate, setBirthDate] = useState("");
  const [color, setColor] = useState("");
  const [weight, setWeight] = useState("");
  const [story, setStory] = useState("");
  const [character, setCharacter] = useState("");

  const [identificationType, setIdentificationType] =
    useState<IdentificationType>("puce");

  const [identificationNumber, setIdentificationNumber] =
    useState("");

  const [sterilizationStatus, setSterilizationStatus] =
    useState<SterilizationStatus>("oui");

  const [sterilizationDate, setSterilizationDate] =
    useState("");

  const [sterilizationNote, setSterilizationNote] =
    useState("");

  const [photoFile, setPhotoFile] =
    useState<File | null>(null);

  const [photoPreview, setPhotoPreview] =
    useState("");

  const canSubmit = useMemo(() => {
    if (!name.trim()) {
      return false;
    }

    if (!identificationNumber.trim()) {
      return false;
    }

    if (sterilizationStatus === "non") {
      return false;
    }

    if (
      sterilizationStatus === "en_cours" &&
      !sterilizationDate
    ) {
      return false;
    }

    return true;
  }, [
    name,
    identificationNumber,
    sterilizationStatus,
    sterilizationDate,
  ]);

  function handlePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] || null;

    setPhotoFile(file);

    if (!file) {
      setPhotoPreview("");
      return;
    }

    const url =
      URL.createObjectURL(file);

    setPhotoPreview(url);
  }

  function handleSubmit() {
    if (!name.trim()) {
      alert(
        "Merci d'indiquer le nom de votre compagnon."
      );
      return;
    }

    if (!identificationNumber.trim()) {
      alert(
        "Le numéro de puce ou de tatouage est obligatoire."
      );
      return;
    }

    if (sterilizationStatus === "non") {
      alert(
        "Pour être ajouté à Taui Te Ora, votre compagnon doit être stérilisé/castré ou avoir une stérilisation en cours."
      );
      return;
    }

    if (
      sterilizationStatus === "en_cours" &&
      !sterilizationDate
    ) {
      alert(
        "Merci d'indiquer la date prévue de stérilisation/castration."
      );
      return;
    }

    alert(
      "Le formulaire est prêt. La prochaine étape sera de connecter cet enregistrement à Supabase."
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f5ead8] px-4 py-6 text-[#3b2417]">
      <section className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() =>
            router.push("/mes-compagnons")
          }
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#064b42] shadow"
        >
          <ArrowLeft size={17} />
          Retour
        </button>

        <div className="rounded-[32px] border border-[#e4cfaa] bg-[#fff3dc] p-5 shadow-xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ef919b] text-white shadow">
              <PawPrint size={28} />
            </div>

            <h1 className="mt-4 text-3xl font-black text-[#064b42] sm:text-4xl">
              Ajouter un compagnon
            </h1>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#6f625a]">
              Créez le profil personnel de votre animal pour
              les balades, la communauté et pour pouvoir
              signaler rapidement sa disparition si nécessaire.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="rounded-[26px] bg-white p-5 shadow">
              <h2 className="text-xl font-black text-[#064b42]">
                Photo
              </h2>

              <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[26px] bg-[#f8f4ec] shadow-inner">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Aperçu"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera
                      size={36}
                      className="text-[#b8aaa0]"
                    />
                  )}
                </div>

                <label className="cursor-pointer rounded-full bg-[#064b42] px-5 py-3 text-center text-sm font-black text-white shadow">
                  Choisir une photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[26px] bg-white p-5 shadow">
              <h2 className="text-xl font-black text-[#064b42]">
                Informations principales
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Nom *
                  </span>

                  <input
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Nom de votre compagnon"
                    className="input"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Espèce *
                  </span>

                  <select
                    value={species}
                    onChange={(event) =>
                      setSpecies(event.target.value)
                    }
                    className="input"
                  >
                    <option value="chien">
                      Chien
                    </option>
                    <option value="chat">
                      Chat
                    </option>
                    <option value="cheval">
                      Cheval
                    </option>
                    <option value="autre">
                      Autre
                    </option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Sexe *
                  </span>

                  <select
                    value={sex}
                    onChange={(event) =>
                      setSex(event.target.value)
                    }
                    className="input"
                  >
                    <option value="male">
                      Mâle
                    </option>
                    <option value="female">
                      Femelle
                    </option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Date de naissance
                  </span>

                  <input
                    type="date"
                    value={birthDate}
                    onChange={(event) =>
                      setBirthDate(
                        event.target.value
                      )
                    }
                    className="input"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Race
                  </span>

                  <input
                    value={breed}
                    onChange={(event) =>
                      setBreed(event.target.value)
                    }
                    placeholder="Race ou croisé"
                    className="input"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Couleur
                  </span>

                  <input
                    value={color}
                    onChange={(event) =>
                      setColor(event.target.value)
                    }
                    placeholder="Noir, blanc, fauve..."
                    className="input"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Poids
                  </span>

                  <input
                    value={weight}
                    onChange={(event) =>
                      setWeight(event.target.value)
                    }
                    placeholder="Ex. 18 kg"
                    className="input"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[26px] bg-white p-5 shadow">
              <h2 className="text-xl font-black text-[#064b42]">
                Identification
              </h2>

              <p className="mt-1 text-sm text-[#6f625a]">
                Ces informations permettront de préparer
                rapidement un signalement en cas de perte.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Type d'identification *
                  </span>

                  <select
                    value={identificationType}
                    onChange={(event) =>
                      setIdentificationType(
                        event.target
                          .value as IdentificationType
                      )
                    }
                    className="input"
                  >
                    <option value="puce">
                      Puce électronique
                    </option>
                    <option value="tatouage">
                      Tatouage
                    </option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Numéro d'identification *
                  </span>

                  <input
                    value={identificationNumber}
                    onChange={(event) =>
                      setIdentificationNumber(
                        event.target.value
                      )
                    }
                    placeholder={
                      identificationType ===
                      "puce"
                        ? "Numéro de puce"
                        : "Numéro de tatouage"
                    }
                    className="input"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[26px] bg-white p-5 shadow">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={24}
                  className="mt-1 shrink-0 text-[#064b42]"
                />

                <div>
                  <h2 className="text-xl font-black text-[#064b42]">
                    Stérilisation / Castration
                  </h2>

                  <p className="mt-1 text-sm leading-relaxed text-[#6f625a]">
                    Pour rejoindre Mes Compagnons, l'animal
                    doit être stérilisé/castré ou avoir une
                    démarche déjà en cours.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() =>
                    setSterilizationStatus("oui")
                  }
                  className={`rounded-[22px] border-2 p-4 text-left transition ${
                    sterilizationStatus === "oui"
                      ? "border-[#6ba98f] bg-[#eaf5f1]"
                      : "border-[#e8ddd5] bg-white"
                  }`}
                >
                  <CheckCircle2
                    size={22}
                    className="text-[#5d9d83]"
                  />

                  <div className="mt-2 font-black text-[#064b42]">
                    Oui
                  </div>

                  <div className="mt-1 text-xs text-[#6f625a]">
                    Déjà stérilisé ou castré
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSterilizationStatus(
                      "en_cours"
                    )
                  }
                  className={`rounded-[22px] border-2 p-4 text-left transition ${
                    sterilizationStatus ===
                    "en_cours"
                      ? "border-[#dca55a] bg-[#fff4df]"
                      : "border-[#e8ddd5] bg-white"
                  }`}
                >
                  <Clock3
                    size={22}
                    className="text-[#c7872f]"
                  />

                  <div className="mt-2 font-black text-[#064b42]">
                    En cours
                  </div>

                  <div className="mt-1 text-xs text-[#6f625a]">
                    Rendez-vous ou démarche prévue
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSterilizationStatus("non")
                  }
                  className={`rounded-[22px] border-2 p-4 text-left transition ${
                    sterilizationStatus === "non"
                      ? "border-[#df8995] bg-[#fce8ec]"
                      : "border-[#e8ddd5] bg-white"
                  }`}
                >
                  <XCircle
                    size={22}
                    className="text-[#df8995]"
                  />

                  <div className="mt-2 font-black text-[#064b42]">
                    Non
                  </div>

                  <div className="mt-1 text-xs text-[#6f625a]">
                    Ajout non autorisé
                  </div>
                </button>
              </div>

              {sterilizationStatus ===
                "en_cours" && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm font-black text-[#064b42]">
                      Date prévue *
                    </span>

                    <input
                      type="date"
                      value={sterilizationDate}
                      onChange={(event) =>
                        setSterilizationDate(
                          event.target.value
                        )
                      }
                      className="input"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-black text-[#064b42]">
                      Commentaire
                    </span>

                    <input
                      value={sterilizationNote}
                      onChange={(event) =>
                        setSterilizationNote(
                          event.target.value
                        )
                      }
                      placeholder="Ex. rendez-vous vétérinaire pris"
                      className="input"
                    />
                  </label>
                </div>
              )}

              {sterilizationStatus === "non" && (
                <div className="mt-5 rounded-[20px] bg-[#fce8ec] p-4 text-sm font-bold leading-relaxed text-[#8a5660]">
                  Cet animal ne peut pas être ajouté à
                  Mes Compagnons tant qu'une stérilisation
                  ou castration n'est pas réalisée ou en cours.
                </div>
              )}
            </div>

            <div className="rounded-[26px] bg-white p-5 shadow">
              <h2 className="text-xl font-black text-[#064b42]">
                Caractère & histoire
              </h2>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Son caractère
                  </span>

                  <textarea
                    value={character}
                    onChange={(event) =>
                      setCharacter(
                        event.target.value
                      )
                    }
                    placeholder="Calme, joueur, sportif, timide, sociable..."
                    rows={4}
                    className="input resize-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Son histoire
                  </span>

                  <textarea
                    value={story}
                    onChange={(event) =>
                      setStory(event.target.value)
                    }
                    placeholder="Racontez son histoire..."
                    rows={6}
                    className="input resize-none"
                  />
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full rounded-full bg-[#064b42] py-4 text-lg font-black text-white shadow-xl transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Ajouter mon compagnon
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
