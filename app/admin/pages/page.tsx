"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Edit3,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

type SitePage = {
  id: string;
  slug: string;
  menu_label: string;
  menu_icon: string | null;
  title: string;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  is_published: boolean;
  show_in_menu: boolean;
  sort_order: number;
  is_system_page: boolean;
};

type PageForm = {
  slug: string;
  menu_label: string;
  menu_icon: string;
  title: string;
  subtitle: string;
  content: string;
  image_url: string;
  is_published: boolean;
  show_in_menu: boolean;
  sort_order: string;
};

const emptyForm: PageForm = {
  slug: "",
  menu_label: "",
  menu_icon: "📄",
  title: "",
  subtitle: "",
  content: "",
  image_url: "",
  is_published: true,
  show_in_menu: true,
  sort_order: "100",
};

export default function AdminPagesPage() {
  const router = useRouter();

  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<PageForm>(emptyForm);

  const [search, setSearch] = useState("");

  useEffect(() => {
    void initialize();
  }, []);

  async function initialize() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace(
          "/login?redirect=/admin/pages"
        );
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const role = String(
        profile?.role || ""
      )
        .trim()
        .toLowerCase();

      if (role !== "admin") {
        router.replace("/");
        return;
      }

      await loadPages();
    } catch (error: any) {
      console.error(
        "Erreur gestion des pages :",
        error
      );

      alert(
        error?.message ||
          "Impossible de charger les pages."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPages() {
    const { data, error } = await supabase
      .from("site_pages")
      .select("*")
      .order("sort_order", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    setPages(
      (data || []) as SitePage[]
    );
  }

  function updateField<
    K extends keyof PageForm,
  >(
    field: K,
    value: PageForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function makeSlug(value: string) {
    return value
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );
  }

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openEditForm(
    page: SitePage
  ) {
    setEditingId(page.id);

    setForm({
      slug: page.slug || "",
      menu_label:
        page.menu_label || "",
      menu_icon:
        page.menu_icon || "📄",
      title:
        page.title || "",
      subtitle:
        page.subtitle || "",
      content:
        page.content || "",
      image_url:
        page.image_url || "",
      is_published:
        page.is_published !== false,
      show_in_menu:
        page.show_in_menu !== false,
      sort_order:
        String(
          page.sort_order ?? 0
        ),
    });

    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function savePage() {
    if (saving) {
      return;
    }

    if (
      !form.menu_label.trim()
    ) {
      alert(
        "Le nom dans le menu est obligatoire."
      );
      return;
    }

    if (!form.title.trim()) {
      alert(
        "Le titre est obligatoire."
      );
      return;
    }

    const slug = makeSlug(
      form.slug ||
        form.menu_label ||
        form.title
    );

    if (!slug) {
      alert(
        "Adresse de page invalide."
      );
      return;
    }

    const order = Number.parseInt(
      form.sort_order || "0",
      10
    );

    const payload = {
      slug,

      menu_label:
        form.menu_label.trim(),

      menu_icon:
        form.menu_icon.trim() ||
        "📄",

      title:
        form.title.trim(),

      subtitle:
        form.subtitle.trim() ||
        null,

      content:
        form.content.trim() ||
        null,

      image_url:
        form.image_url.trim() ||
        null,

      is_published:
        form.is_published,

      show_in_menu:
        form.show_in_menu,

      sort_order:
        Number.isFinite(order)
          ? order
          : 0,

      updated_at:
        new Date().toISOString(),
    };

    try {
      setSaving(true);

      if (editingId) {
        const { error } =
          await supabase
            .from("site_pages")
            .update(payload)
            .eq(
              "id",
              editingId
            );

        if (error) {
          throw error;
        }

        alert(
          "Page modifiée."
        );
      } else {
        const { error } =
          await supabase
            .from("site_pages")
            .insert({
              ...payload,
              is_system_page:
                false,
            });

        if (error) {
          throw error;
        }

        alert(
          "Nouvelle page créée."
        );
      }

      await loadPages();
      closeForm();
    } catch (error: any) {
      console.error(
        "Erreur sauvegarde page :",
        error
      );

      alert(
        error?.message ||
          "Impossible d'enregistrer la page."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updatePage(
    id: string,
    values: Partial<SitePage>
  ) {
    try {
      const { error } =
        await supabase
          .from("site_pages")
          .update({
            ...values,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", id);

      if (error) {
        throw error;
      }

      await loadPages();
    } catch (error: any) {
      alert(
        error?.message ||
          "Impossible de modifier la page."
      );
    }
  }

  async function deletePage(
    page: SitePage
  ) {
    if (
      page.is_system_page
    ) {
      alert(
        "Cette page principale ne peut pas être supprimée. Vous pouvez la masquer."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Supprimer définitivement "${page.menu_label}" ?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        page.id
      );

      const { error } =
        await supabase
          .from("site_pages")
          .delete()
          .eq(
            "id",
            page.id
          );

      if (error) {
        throw error;
      }

      await loadPages();
    } catch (error: any) {
      alert(
        error?.message ||
          "Impossible de supprimer la page."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function movePage(
    page: SitePage,
    direction: "up" | "down"
  ) {
    const sorted =
      [...pages].sort(
        (a, b) =>
          a.sort_order -
          b.sort_order
      );

    const index =
      sorted.findIndex(
        (item) =>
          item.id === page.id
      );

    const targetIndex =
      direction === "up"
        ? index - 1
        : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >=
        sorted.length
    ) {
      return;
    }

    const target =
      sorted[targetIndex];

    const currentOrder =
      page.sort_order;

    const targetOrder =
      target.sort_order;

    try {
      const first =
        await supabase
          .from("site_pages")
          .update({
            sort_order:
              targetOrder,
          })
          .eq(
            "id",
            page.id
          );

      if (first.error) {
        throw first.error;
      }

      const second =
        await supabase
          .from("site_pages")
          .update({
            sort_order:
              currentOrder,
          })
          .eq(
            "id",
            target.id
          );

      if (second.error) {
        throw second.error;
      }

      await loadPages();
    } catch (error: any) {
      alert(
        error?.message ||
          "Impossible de changer l'ordre."
      );
    }
  }

  const filteredPages =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return pages;
      }

      return pages.filter(
        (page) =>
          [
            page.menu_label,
            page.title,
            page.slug,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
      );
    }, [
      pages,
      search,
    ]);

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fbf7ef]">
        <p className="font-black text-[#064b42]">
          Chargement des pages...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#fbf7ef] px-4 pb-24 pt-6 sm:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/dashboard"
                )
              }
              className="mb-4 flex items-center gap-2 text-sm font-black text-[#6f665f]"
            >
              <ArrowLeft
                size={18}
              />

              Retour administration
            </button>

            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#df8995]">
              TAUI TE ORA
            </p>

            <h1 className="mt-1 text-4xl font-black text-[#064b42]">
              Gestion des pages
            </h1>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center justify-center gap-2 rounded-full bg-[#064b42] px-7 py-4 font-black text-white shadow-lg"
          >
            <FilePlus2
              size={20}
            />

            Ajouter une page
          </button>
        </div>

        {formOpen && (
          <section className="mt-7 rounded-[30px] bg-white p-5 shadow-xl sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#064b42]">
                {editingId
                  ? "Modifier la page"
                  : "Nouvelle page"}
              </h2>

              <button
                type="button"
                onClick={
                  closeForm
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5eee6]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Input
                label="Nom dans le menu"
                value={
                  form.menu_label
                }
                onChange={(
                  value
                ) => {
                  updateField(
                    "menu_label",
                    value
                  );

                  if (
                    !editingId
                  ) {
                    updateField(
                      "slug",
                      makeSlug(
                        value
                      )
                    );
                  }
                }}
              />

              <Input
                label="Icône"
                value={
                  form.menu_icon
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "menu_icon",
                    value
                  )
                }
              />

              <Input
                label="Adresse"
                value={
                  form.slug
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "slug",
                    makeSlug(
                      value
                    )
                  )
                }
                disabled={
                  Boolean(
                    editingId
                  )
                }
              />

              <Input
                label="Ordre menu"
                type="number"
                value={
                  form.sort_order
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "sort_order",
                    value
                  )
                }
              />

              <div className="md:col-span-2">
                <Input
                  label="Titre"
                  value={
                    form.title
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "title",
                      value
                    )
                  }
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Sous-titre"
                  value={
                    form.subtitle
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "subtitle",
                      value
                    )
                  }
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Image"
                  value={
                    form.image_url
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "image_url",
                      value
                    )
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label>
                  <span className="mb-2 block text-sm font-black text-[#064b42]">
                    Contenu
                  </span>

                  <textarea
                    rows={16}
                    value={
                      form.content
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "content",
                        event.target.value
                      )
                    }
                    className="w-full resize-y rounded-[18px] border border-[#ded4c5] bg-[#fffaf7] px-4 py-3 leading-7 outline-none"
                  />
                </label>
              </div>

              <Toggle
                label="Page publiée"
                checked={
                  form.is_published
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "is_published",
                    value
                  )
                }
              />

              <Toggle
                label="Afficher dans le menu"
                checked={
                  form.show_in_menu
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "show_in_menu",
                    value
                  )
                }
              />
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={
                  closeForm
                }
                className="rounded-full bg-[#f3eee9] px-6 py-3 font-black"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={
                  savePage
                }
                disabled={
                  saving
                }
                className="flex items-center gap-2 rounded-full bg-[#064b42] px-7 py-3 font-black text-white"
              >
                <Save
                  size={18}
                />

                {saving
                  ? "Enregistrement..."
                  : "Enregistrer"}
              </button>
            </div>
          </section>
        )}

        <div className="relative mt-7">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Rechercher une page..."
            className="w-full rounded-[18px] border bg-white py-3 pl-11 pr-4"
          />
        </div>

        <div className="mt-6 space-y-4">
          {filteredPages.map(
            (page) => (
              <article
                key={
                  page.id
                }
                className="rounded-[26px] bg-white p-5 shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f4ec] text-2xl">
                      {page.menu_icon ||
                        "📄"}
                    </div>

                    <div>
                      <h2 className="text-xl font-black text-[#064b42]">
                        {
                          page.menu_label
                        }
                      </h2>

                      <p className="text-sm text-gray-500">
                        /pages/
                        {page.slug}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button
                      onClick={() =>
                        openEditForm(
                          page
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#064b42] px-4 py-3 font-black text-white"
                    >
                      <Edit3
                        size={16}
                      />
                      Modifier
                    </button>

                    <button
                      onClick={() =>
                        updatePage(
                          page.id,
                          {
                            is_published:
                              !page.is_published,
                          }
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#edf7f4] px-4 py-3 font-black text-[#064b42]"
                    >
                      {page.is_published ? (
                        <Eye
                          size={16}
                        />
                      ) : (
                        <EyeOff
                          size={16}
                        />
                      )}

                      {page.is_published
                        ? "Publiée"
                        : "Publier"}
                    </button>

                    <button
                      onClick={() =>
                        updatePage(
                          page.id,
                          {
                            show_in_menu:
                              !page.show_in_menu,
                          }
                        )
                      }
                      className="rounded-xl bg-[#f8f4ec] px-4 py-3 font-black"
                    >
                      {page.show_in_menu
                        ? "Masquer"
                        : "Menu"}
                    </button>

                    <button
                      onClick={() =>
                        deletePage(
                          page
                        )
                      }
                      disabled={
                        page.is_system_page ||
                        deletingId ===
                          page.id
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 font-black text-red-600 disabled:opacity-30"
                    >
                      <Trash2
                        size={16}
                      />
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                  <button
                    onClick={() =>
                      movePage(
                        page,
                        "up"
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8f4ec]"
                  >
                    <ArrowUp
                      size={17}
                    />
                  </button>

                  <button
                    onClick={() =>
                      movePage(
                        page,
                        "down"
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8f4ec]"
                  >
                    <ArrowDown
                      size={17}
                    />
                  </button>
                </div>
              </article>
            )
          )}
        </div>
      </section>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-black text-[#064b42]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        disabled={
          disabled
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-[18px] border border-[#ded4c5] bg-[#fffaf7] px-4 py-3 outline-none disabled:bg-gray-100"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
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
      className={`rounded-[20px] border-2 p-4 text-left font-black ${
        checked
          ? "border-[#064b42] bg-[#edf7f4] text-[#064b42]"
          : "border-[#e8ded5] bg-[#fffaf7] text-gray-500"
      }`}
    >
      {checked
        ? "✓ "
        : ""}
      {label}
    </button>
  );
}