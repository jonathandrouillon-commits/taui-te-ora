"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ClipboardCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";

type ConditionRow = {
  id: string;
  label: string;
  sort_order: number;
};

type Props = {
  profileId: string;
};

export default function StructureAdoptionConditions({ profileId }: Props) {
  const [conditions, setConditions] = useState<ConditionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConditions = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("adoption_conditions")
        .select("id, label, sort_order")
        .eq("owner_id", profileId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      setConditions((data || []) as ConditionRow[]);
    } catch (error) {
      console.error("Erreur chargement conditions adoption :", error);
      setConditions([]);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (!profileId) return;
    queueMicrotask(() => void loadConditions());
  }, [loadConditions, profileId]);

  if (loading) {
    return (
      <section className="mt-8 rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-sm">
        <p className="font-bold text-[#6f5a47]">Chargement des conditions d&apos;adoption...</p>
      </section>
    );
  }

  if (conditions.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-sm sm:p-7">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf7f4] text-[#064b42]">
          <ClipboardCheck size={24} />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#df8995]">
            Adoption responsable
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#064b42]">
            Conditions d&apos;adoption
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#6f5a47]">
            Ces conditions doivent être lues, acceptées une par une et signées avant l&apos;envoi d&apos;une demande d&apos;adoption.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {conditions.map((condition) => (
          <div
            key={condition.id}
            className="flex items-start gap-3 rounded-[20px] bg-[#fffaf5] p-4"
          >
            <CheckCircle2 className="mt-0.5 shrink-0 text-[#df8995]" size={19} />
            <p className="leading-6 text-[#40372f]">{condition.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
