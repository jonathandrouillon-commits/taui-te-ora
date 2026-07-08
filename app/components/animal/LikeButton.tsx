"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type LikeButtonProps = {
  animalId: string;
};

export default function LikeButton({ animalId }: LikeButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [likeId, setLikeId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkLike();
  }, [animalId]);

  async function checkLike() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserId(null);
      setLiked(false);
      return;
    }

    setUserId(user.id);

    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("animal_id", animalId)
      .maybeSingle();

    if (data) {
      setLikeId(data.id);
      setLiked(true);
    } else {
      setLikeId(null);
      setLiked(false);
    }
  }

  async function toggleLike() {
    if (loading) return;

    if (!userId) {
      window.location.href = "/login";
      return;
    }

    try {
      setLoading(true);

      if (liked && likeId) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("id", likeId);

        if (error) throw error;

        setLikeId(null);
        setLiked(false);
      } else {
        const { data, error } = await supabase
          .from("likes")
          .insert({
            user_id: userId,
            animal_id: animalId,
          })
          .select("id")
          .single();

        if (error) throw error;

        setLikeId(data.id);
        setLiked(true);
      }
    } catch (error) {
      console.error(error);
      alert("Impossible de modifier le like.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleLike}
      disabled={loading}
      className={`rounded-full px-5 py-3 text-sm font-bold shadow-md transition ${
        liked ? "bg-red-500 text-white" : "bg-white text-[#2f241c]"
      }`}
    >
      {loading ? "..." : liked ? "❤️ Liké" : "🤍 Like"}
    </button>
  );
}