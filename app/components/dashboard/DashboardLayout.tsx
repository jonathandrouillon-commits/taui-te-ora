import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-[32px] bg-white p-6 shadow-md">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[#b58b5b]">
            TAUI TE ORA
          </p>

          <h1 className="text-3xl font-bold text-[#2f241c]">
            Dashboard Association
          </h1>

          <nav className="mt-4 flex flex-wrap gap-3">
            <Link href="/" className="text-sm font-semibold text-[#6f6257]">
              Accueil
            </Link>
            <Link
              href="/association/dashboard"
              className="text-sm font-semibold text-[#6f6257]"
            >
              Dashboard
            </Link>
            <Link
              href="/association/animal/new"
              className="text-sm font-semibold text-[#6f6257]"
            >
              Ajouter un animal
            </Link>
          </nav>
        </header>

        {children}
      </div>
    </main>
  );
}