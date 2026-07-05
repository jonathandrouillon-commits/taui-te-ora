"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="flex items-center gap-2 rounded-full bg-white px-5 py-3 font-black text-[#064b42] shadow-lg hover:bg-gray-50 transition"
    >
      <LogOut size={20} />
      Déconnexion
    </button>
  );
}