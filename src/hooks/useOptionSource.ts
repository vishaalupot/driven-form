import { OptionSource, FormDataState } from "@/types/schema";
import { useEffect, useState } from "react";

interface Option {
  label: string;
  value: string | number;
}

export function useOptionSource(optionSource: OptionSource | undefined, formData: FormDataState, apiUrl?: string) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!optionSource) return; // ✅ Ensures optionSource is a string here

    async function fetchOptions() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(String(optionSource)); // ✅ TS now knows it's a string
        if (!res.ok) throw new Error("Failed to fetch options");

        const data: Option[] = await res.json();
        setOptions(data);
      } catch (err: any) {
        setError(err.message || "Error fetching options");
      } finally {
        setLoading(false);
      }
    }

    fetchOptions();
  }, [optionSource]);

  return { options, loading, error };
}
