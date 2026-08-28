import Link from "next/link";
import PublisherDashboard from "../../components/PublisherDashboard";

export default function BenevoleDashboardPage() {
  return (
    <>
      <PublisherDashboard expectedRole="benevole" />

      <section className="mx-auto -mt-2 mb-28 w-full max-w-7xl px-4 sm:px-6">
        <div className="rounded-[28px] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#df8995]">
                ENTRAIDE
              </p>

              <h2 className="mt-1 text-2xl font-black text-[#064b42]">
                🤝 Réseau d’aide
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#756d67]">
                Retrouvez le réseau d’entraide et consultez les SOS actifs.
                Vous pourrez ensuite répondre aux demandes qui correspondent à vos disponibilités.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/reseau-aide"
                className="flex items-center justify-center rounded-full bg-[#064b42] px-5 py-3 font-black text-white shadow-md transition hover:bg-[#08695d]"
              >
                Voir le réseau d’aide
              </Link>

              <Link
                href="/sos-aide"
                className="flex items-center justify-center rounded-full bg-[#fff0f3] px-5 py-3 font-black text-[#c85f72] shadow-sm transition hover:bg-[#ffe5ea]"
              >
                🚨 Voir les SOS
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
