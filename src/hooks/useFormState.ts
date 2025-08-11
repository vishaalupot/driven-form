
import { useState } from "react";

export function useFormState(initialState: Record<string, unknown> = {}) {
  const [formData, setFormData] = useState(initialState);

  const updateField = (name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return { formData, updateField };
}
