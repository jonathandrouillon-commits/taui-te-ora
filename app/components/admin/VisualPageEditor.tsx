"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase";

type TextOverride = {
  id?: string;
  pathname: string;
  original_text: string;
  occurrence_index: number;
  replacement_text: string;
};

const EDITABLE_SELECTOR =
  "h1,h2,h3,h4,h5,h6,p,span,button,a,label,legend,li,option,blockquote";

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isEditorChrome(element: Element) {
  return Boolean(element.closest("[data-taui-editor-ui='true']"));
}

function shouldIgnore(element: HTMLElement) {
  if (isEditorChrome(element)) return true;
  if (element.closest("nav")) return true;
  if (element.closest("[role='dialog']")) return true;
  if (element.closest("script,style,noscript")) return true;
  if (element.children.length > 0) return true;

  const text = normalizeText(element.textContent || "");
  if (!text || text.length > 800) return true;

  return false;
}

function collectEditableElements() {
  return Array.from(document.querySelectorAll<HTMLElement>(EDITABLE_SELECTOR)).filter(
    (element) => !shouldIgnore(element)
  );
}

function buildOccurrenceMap(elements: HTMLElement[]) {
  const counters = new Map<string, number>();
  return elements.map((element) => {
    const original = normalizeText(element.dataset.tauiOriginalText || element.textContent || "");
    const occurrence = counters.get(original) || 0;
    counters.set(original, occurrence + 1);
    return { element, original, occurrence };
  });
}

function applyOverridesToPage(overrides: TextOverride[]) {
  const elements = collectEditableElements();
  const mapped = buildOccurrenceMap(elements);

  for (const { element, original, occurrence } of mapped) {
    if (!element.dataset.tauiOriginalText) {
      element.dataset.tauiOriginalText = original;
    }

    const match = overrides.find(
      (item) =>
        item.original_text === original && item.occurrence_index === occurrence
    );

    if (match) {
      element.textContent = match.replacement_text;
    }
  }
}

export default function VisualPageEditor() {
  const pathname = usePathname();
  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [overrides, setOverrides] = useState<TextOverride[]>([]);
  const observerRef = useRef<MutationObserver | null>(null);
  const changeMapRef = useRef<Map<string, TextOverride>>(new Map());

  const editorActive = useMemo(() => editMode && isAdmin, [editMode, isAdmin]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEditMode(params.get("edit") === "1");
  }, [pathname]);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let admin = false;

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          const role = String(profile?.role || "").trim().toLowerCase();
          admin = role === "admin" || role === "administrateur";
        }

        if (!active) return;

        setIsAdmin(admin);

        const { data, error } = await supabase
          .from("page_text_overrides")
          .select(
            "id, pathname, original_text, occurrence_index, replacement_text"
          )
          .eq("pathname", pathname);

        if (!active) return;

        if (error) {
          console.error("Erreur chargement textes administrables :", error);
        } else {
          const rows = (data || []) as TextOverride[];
          setOverrides(rows);

          window.setTimeout(() => {
            applyOverridesToPage(rows);
          }, 0);
        }
      } finally {
        if (active) setReady(true);
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!ready) return;

    const apply = () => applyOverridesToPage(overrides);

    apply();

    const observer = new MutationObserver(() => {
      if (editorActive) return;
      apply();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [editorActive, overrides, ready]);

  useEffect(() => {
    if (!editorActive) return;

    observerRef.current?.disconnect();

    const elements = collectEditableElements();
    const mapped = buildOccurrenceMap(elements);

    const cleanups: Array<() => void> = [];

    mapped.forEach(({ element, original, occurrence }) => {
      if (!element.dataset.tauiOriginalText) {
        element.dataset.tauiOriginalText = original;
      }

      element.contentEditable = "true";
      element.spellcheck = true;
      element.dataset.tauiEditable = "true";
      element.style.outline = "2px dashed rgba(223,137,149,.75)";
      element.style.outlineOffset = "3px";
      element.style.cursor = "text";

      const onInput = () => {
        const replacement = normalizeText(element.textContent || "");
        const key = `${original}::${occurrence}`;

        if (replacement === original) {
          changeMapRef.current.delete(key);
          return;
        }

        changeMapRef.current.set(key, {
          pathname,
          original_text: original,
          occurrence_index: occurrence,
          replacement_text: replacement,
        });
      };

      element.addEventListener("input", onInput);

      cleanups.push(() => {
        element.removeEventListener("input", onInput);
        element.contentEditable = "false";
        delete element.dataset.tauiEditable;
        element.style.outline = "";
        element.style.outlineOffset = "";
        element.style.cursor = "";
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [editorActive, pathname]);

  async function saveChanges() {
    if (saving) return;

    const changes = Array.from(changeMapRef.current.values());

    if (!changes.length) {
      setNotice("Aucune modification à enregistrer.");
      return;
    }

    try {
      setSaving(true);
      setNotice("");

      const payload = changes.map((item) => ({
        pathname: item.pathname,
        original_text: item.original_text,
        occurrence_index: item.occurrence_index,
        replacement_text: item.replacement_text,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("page_text_overrides")
        .upsert(payload, {
          onConflict: "pathname,original_text,occurrence_index",
        });

      if (error) throw error;

      changeMapRef.current.clear();
      setNotice("Modifications enregistrées.");

      const { data } = await supabase
        .from("page_text_overrides")
        .select(
          "id, pathname, original_text, occurrence_index, replacement_text"
        )
        .eq("pathname", pathname);

      setOverrides((data || []) as TextOverride[]);
    } catch (error) {
      console.error("Erreur sauvegarde édition visuelle :", error);
      setNotice(
        error instanceof Error ? error.message : "Impossible d’enregistrer."
      );
    } finally {
      setSaving(false);
    }
  }

  function exitEditor() {
    router.replace(pathname);
  }

  if (!editMode || !isAdmin) return null;

  return (
    <div
      data-taui-editor-ui="true"
      className="fixed inset-x-0 top-0 z-[9999] border-b border-[#eadfd8] bg-[#064b42]/95 px-3 py-3 text-white shadow-xl backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f6c4cc]">
            Mode administration
          </p>
          <p className="text-sm font-bold">
            Cliquez directement sur un texte pour le modifier.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notice ? (
            <span className="hidden rounded-full bg-white/10 px-3 py-2 text-xs font-bold sm:inline">
              {notice}
            </span>
          ) : null}

          <button
            type="button"
            onClick={exitEditor}
            className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-black"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={() => void saveChanges()}
            disabled={saving}
            className="rounded-full bg-[#df8995] px-5 py-2 text-sm font-black text-white disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
