<nav className="fixed bottom-0 left-0 right-0 z-[80] border-t border-[#eadfce] bg-white/95 px-2 pb-1 pt-1 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur">
  <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-1 pb-1 pt-1">
    {mainItems.map((item) => {
      const isActive =
        item.href !== "#" &&
        (pathname === item.href || pathname.startsWith(item.href + "/"));

      if (item.menu) {
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center gap-0.5"
          >
            <span
              className={`text-[24px] ${
                menuOpen ? "text-[#064b42]" : "text-[#6f7b63]"
              }`}
            >
              {item.icon}
            </span>

            <span
              className={`text-[10px] font-black uppercase leading-none ${
                menuOpen ? "text-[#064b42]" : "text-[#6f7b63]"
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      }

      if (item.sos) {
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative -mt-6 flex flex-col items-center justify-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dc7a4b] shadow-xl ring-4 ring-white">
              <img
                src="/sos-paw.png"
                alt="SOS"
                className="h-12 w-12 object-contain"
              />
            </span>
          </Link>
        );
      }

      return (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-col items-center justify-center gap-0.5"
        >
          <span className="text-[24px]">{item.icon}</span>

          <span
            className={`text-[10px] font-black uppercase leading-none ${
              isActive ? "text-[#064b42]" : "text-[#6f7b63]"
            }`}
          >
            {item.label}
          </span>
        </Link>
      );
    })}
  </div>
</nav>