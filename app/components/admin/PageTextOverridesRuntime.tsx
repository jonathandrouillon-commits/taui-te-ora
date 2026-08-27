"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { supabase } from "../../lib/supabase";

type TextOverride = {
  original_text: string;
  occurrence_index: number;
  replacement_text: string;
};

const SELECTOR =
  "h1,h2,h3,h4,h5,h6,p,span,button,a,label,legend,li,option,blockquote";

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function shouldIgnore(element: HTMLElement) {
  if (element.closest("[data-taui-editor-ui='true']")) return true;
  if (element.closest("nav")) return true;
  if (element.closest("script,style,noscript")) return true;
  if (element.children.length > 0) return true;

  const text = normalizeText(element.dataset.tauiOriginalText || element.textContent || "");
  return !text || text.length > 800;
}

function apply(overrides: TextOverride[]) {
  const counters = new Map<string, number>();

  for (const element of Array.from(
    document.querySelectorAll<HTMLElement>(SELECTOR)
  )) {
    if (shouldIgnore(element)) continue;

    const original = normalizeText(
      element.dataset.tauiOriginalText || element.textContent || ""
    );

    if (!element.dataset.tauiOriginalText) {
      element.dataset.tauiOriginalText = original;
    }

    const occurrence = counters.get(original) || 0;
    counters.set(original, occurrence + 1);

    const match = overrides.find(
      (item) =>
        item.original_text === original && item.occurrence_index === occurrence
    );

    if (match && !element.isContentEditable) {
      element.textContent = match.replacement_text;
    }
  }
}

export default function PageTextOverridesRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    let observer: MutationObserver | null = null;

    async function load() {
      const { data, error } = await supabase
        .from("page_text_overrides")
        .select("original_text, occurrence_index, replacement_text")
        .eq("pathname", pathname);

      if (!active) return;

      if (error) {
        console.error("Erreur chargement textes personnalisés :", error);
        return;
      }

      const overrides = (data || []) as TextOverride[];

      const run = () => apply(overrides);
      run();

      observer = new MutationObserver(run);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    void load();

    return () => {
      active = false;
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
