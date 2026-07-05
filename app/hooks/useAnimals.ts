"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useAnimals() {
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnimals() {
      const { data: animalsData, error } = await supabase
        .from("animals")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const { data: photosData } = await supabase
        .from("animal_photos")
        .select("*");

      const animalsWithPhotos =
        animalsData?.map((animal) => {
          const photo =
            photosData?.find(
              (p) => p.animal_id === animal.id && p.is_cover === true
            ) || photosData?.find((p) => p.animal_id === animal.id);

          return {
            ...animal,
            photo_url: photo?.photo_url || "",
          };
        }) || [];

      setAnimals(animalsWithPhotos);
      setLoading(false);
    }

    loadAnimals();
  }, []);

  return { animals, loading };
}