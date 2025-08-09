// src/hooks/useFormState.ts
import { useState } from "react";

export function useFormState(initialState: Record<string, any> = {}) {
  const [formData, setFormData] = useState(initialState);

  const updateField = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return { formData, updateField };
}
