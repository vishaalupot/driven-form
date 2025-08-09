import { FieldSchema, FormDataState } from "@/types/schema";

export function checkDependencies(
  field: FieldSchema,
  formData: FormDataState
): boolean {
  if (!field.dependencies) return true;

  return field.dependencies.every(dep => {
    const currentValue = formData[dep.key];

    if (dep.equals !== undefined) {
      return currentValue === dep.equals;
    }
    if (dep.notEmpty) {
      return currentValue !== undefined && currentValue !== "";
    }
    return true;
  });
}
