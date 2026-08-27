"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createWalk } from "../../services/walk.service";

export default function CreateWalkPage() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setError("");

    const form = new FormData(event.currentTarget);

    try {
      const { data, error: createError } = await createWalk({
        title: String(form.get("title")),
        description: String(form.get("description") || ""),
        location: String(form.get("location")),
        starts_at: new Date(
          String(form.get("starts_at"))
        ).toISOString(),
        duration_minutes: Number(
          form.get("duration_minutes")
        ),
        max_dogs: Number(form.get("max_dogs")),
        pace: String(form.get("pace")) as
          | "calme"
          | "moderee"
          | "sportive",
        audience: String(form.get("audience")),
      });

      if (createError) {
        throw createError;
      }

      router.push(`/balades/${data.id}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de créer la balade."
      );

      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-2xl border border-[#d9cec7] bg-white px-4 py-3 outline-none focus:border-[#ef7f61]";

  return (
    <main className="min-h-[100dvh] bg-[#f4eee3] px-4 py-8 pb-28 text-[#064b42]">
      <form
        onSubmit={submit}
        className="mx-auto max-w-xl rounded-[32px] bg-white p-6 shadow-sm sm:p-8"
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 font-black"
        >
          ← Retour
        </button>

        <h1 className="text-3xl font-black">
          Organiser une balade
        </h1>

        <p className="mb-6 mt-2 text-sm text-[#416c66]">
          La balade doit rester collective et dédiée au
          bien-être animal.
        </p>

        <div className="space-y-4">
          <label className="block text-sm font-bold">
            Nom de la balade
            <input
              required
              name="title"
              className={field}
              placeholder="Balade du dimanche"
            />
          </label>

          <label className="block text-sm font-bold">
            Lieu
            <input
              required
              name="location"
              className={field}
              placeholder="Parc Paofai"
            />
          </label>

          <label className="block text-sm font-bold">
            Date et heure
            <input
              required
              name="starts_at"
              type="datetime-local"
              className={field}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-bold">
              Durée (minutes)
              <input
                required
                name="duration_minutes"
                type="number"
                min="15"
                max="240"
                defaultValue="45"
                className={field}
              />
            </label>

            <label className="text-sm font-bold">
              Chiens maximum
              <input
                required
                name="max_dogs"
                type="number"
                min="2"
                max="20"
                defaultValue="6"
                className={field}
              />
            </label>
          </div>

          <label className="block text-sm font-bold">
            Rythme
            <select name="pace" className={field}>
              <option value="calme">Tranquille</option>
              <option value="moderee">Modéré</option>
              <option value="sportive">Sportif</option>
            </select>
          </label>

          <label className="block text-sm font-bold">
            Pour quels chiens ?
            <input
              required
              name="audience"
              className={field}
              placeholder="Tous, chiens timides, chiots…"
            />
          </label>

          <label className="block text-sm font-bold">
            Informations utiles
            <textarea
              name="description"
              rows={4}
              className={field}
              placeholder="Point de rendez-vous, matériel à prévoir…"
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
            {error}
          </p>
        )}

        <button
          disabled={busy}
          className="mt-6 w-full rounded-full bg-[#ef7f61] px-5 py-3.5 font-black text-white disabled:opacity-60"
        >
          {busy ? "Création…" : "Créer la balade"}
        </button>
      </form>
    </main>
  );
}