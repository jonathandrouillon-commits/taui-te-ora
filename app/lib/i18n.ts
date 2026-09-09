"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

export type Language =
  | "fr"
  | "en";

const STORAGE_KEY =
  "taui-te-ora-language";

const LANGUAGE_EVENT =
  "taui-te-ora-language-change";

export const translations = {
  fr: {
    header: {
      home: "Accueil",
      adoption: "Adoption",
      associations:
        "Associations",
      login: "Connexion",
      register:
        "Créer un compte",
      searchPlaceholder:
        "Rechercher un animal...",
      filters: "Filtres",
      french: "Français",
      english: "English",
    },
  },

  en: {
    header: {
      home: "Home",
      adoption: "Adoption",
      associations:
        "Associations",
      login: "Log in",
      register:
        "Create account",
      searchPlaceholder:
        "Search for an animal...",
      filters: "Filters",
      french: "Français",
      english: "English",
    },
  },
} as const;

export function getStoredLanguage():
  Language {
  if (
    typeof window ===
    "undefined"
  ) {
    return "fr";
  }

  const stored =
    window.localStorage.getItem(
      STORAGE_KEY
    );

  if (
    stored === "fr" ||
    stored === "en"
  ) {
    return stored;
  }

  return "fr";
}

export function storeLanguage(
  language: Language
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    language
  );

  window.dispatchEvent(
    new CustomEvent(
      LANGUAGE_EVENT,
      {
        detail: language,
      }
    )
  );
}

export function useLanguage() {
  const [
    language,
    setLanguageState,
  ] =
    useState<Language>("fr");

  useEffect(() => {
    setLanguageState(
      getStoredLanguage()
    );

    function handleLanguageChange(
      event: Event
    ) {
      const customEvent =
        event as CustomEvent<Language>;

      if (
        customEvent.detail ===
          "fr" ||
        customEvent.detail ===
          "en"
      ) {
        setLanguageState(
          customEvent.detail
        );
      }
    }

    function handleStorage(
      event: StorageEvent
    ) {
      if (
        event.key !==
        STORAGE_KEY
      ) {
        return;
      }

      if (
        event.newValue ===
          "fr" ||
        event.newValue ===
          "en"
      ) {
        setLanguageState(
          event.newValue
        );
      }
    }

    window.addEventListener(
      LANGUAGE_EVENT,
      handleLanguageChange
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        LANGUAGE_EVENT,
        handleLanguageChange
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  const setLanguage =
    useCallback(
      (
        nextLanguage:
          Language
      ) => {
        setLanguageState(
          nextLanguage
        );

        storeLanguage(
          nextLanguage
        );
      },
      []
    );

  return {
    language,
    setLanguage,
    translations:
      translations[language],
  };
}