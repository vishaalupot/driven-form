export type FieldType =
  | "text"
  | "number"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "group";

export interface FieldDependency {
  key: string;
  equals?: any;       // e.g., equals: true
  notEmpty?: boolean; // e.g., notEmpty: true
}

export interface OptionSource {
  key: string;
  map: Record<string, string[]>; // e.g., propertyType -> [Apartment, Villa]
}

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];           // Static select options
  optionSource?: OptionSource;  // Dynamic options
  dependencies?: FieldDependency[];
  fields?: FieldSchema[];       // For "group"
}

export interface StepSchema {
  title: string;
  fields: FieldSchema[];
}

export interface FormSchema {
  steps: StepSchema[];
}

export type FormDataState = Record<string, any>;
