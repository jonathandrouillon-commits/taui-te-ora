"use client";

type TabKey =
  | "general"
  | "photos"
  | "health"
  | "character"
  | "story"
  | "location"
  | "adoption"
  | "preview";

type Props = {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "general", label: "Général" },
  { key: "photos", label: "Photos" },
  { key: "health", label: "Santé" },
  { key: "character", label: "Caractère" },
  { key: "story", label: "Histoire" },
  { key: "location", label: "Localisation" },
  { key: "adoption", label: "Adoption" },
  { key: "preview", label: "Aperçu" },
];

export default function AnimalTabs({ activeTab, setActiveTab }: Props) {
  return (
    <div className="flex flex-wrap gap-3 rounded-3xl bg-white p-4 shadow">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => setActiveTab(tab.key)}
          className={`rounded-2xl px-4 py-3 font-black transition ${
            activeTab === tab.key
              ? "bg-[#064b42] text-white"
              : "bg-[#f4eee3] text-[#064b42]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export type { TabKey };