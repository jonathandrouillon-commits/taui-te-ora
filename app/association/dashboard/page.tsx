import Link from "next/link";
import PublisherDashboard from "../../components/PublisherDashboard";

export default function AssociationDashboardPage() {
  return (
    <>
      <PublisherDashboard expectedRole="association" />

      <div className="fixed bottom-24 right-4 z-[250] sm:bottom-8 sm:right-8">
        <Link
          href="/reseau-aide"
          className="flex items-center gap-2 rounded-full bg-[#064b42] px-5 py-3 font-black text-white shadow-xl transition hover:bg-[#08695d] active:scale-[0.98]"
        >
          <span aria-hidden="true">🤝</span>
          Réseau d’aide
        </Link>
      </div>
    </>
  );
}
