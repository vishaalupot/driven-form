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
  equals?: string | number | boolean | null;
  notEmpty?: boolean; 
}

export interface OptionSource {
  key: string;
  map: Record<string, string[]>; 
}

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];          
  optionSource?: OptionSource;  
  dependencies?: FieldDependency[];
  fields?: FieldSchema[];      
}

export interface StepSchema {
  title: string;
  fields: FieldSchema[];
}

export interface FormSchema {
  steps: StepSchema[];
}


export type FormDataState = Record<string, any>;
