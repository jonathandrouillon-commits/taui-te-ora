"use client";

type DashboardHeaderProps = {
  fullName?: string;
  email?: string;
  role?: string;
  island?: string;
  avatarUrl?: string;
  onLogout: () => void;
};

export default function DashboardHeader({
  fullName,
  email,
  role,
  island,
  avatarUrl,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-md">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#eadfce]">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Photo profil"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[#9c7b54]">
              Mon espace
            </p>

            <h1 className="text-3xl font-bold text-[#2f241c]">
              {fullName || "Mon profil"}
            </h1>

            <p className="mt-1 text-[#6f5a47]">
              {role || "Adoptant"} · {island || "Île non renseignée"}
            </p>

            {email && (
              <p className="mt-1 text-sm text-[#9b8a7a]">
                {email}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="rounded-full bg-[#2f241c] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#4a392c]"
        >
          Déconnexion
        </button>
      </div>
    </section>
  );
}