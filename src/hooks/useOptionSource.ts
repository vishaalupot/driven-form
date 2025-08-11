"use client";

import { OptionSource } from "@/types/schema";
import { useEffect, useState } from "react";

interface Option {
  label: string;
  value: string | number;
}

export function useOptionSource(optionSource: OptionSource) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!optionSource) return;  

    async function fetchOptions() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(String(optionSource)); 
        if (!res.ok) throw new Error("Failed to fetch options");

        const data: Option[] = await res.json();
        setOptions(data);
      } catch (err: unknown) {
        // Proper error handling without 'any'
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === 'string') {
          setError(err);
        } else {
          setError("Error fetching options");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchOptions();
  }, [optionSource]);

  return { options, loading, error };
}