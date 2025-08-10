"use client";

import { Controller, useForm } from "react-hook-form";
import { FieldSchema, FormSchema, FormDataState } from "@/types/schema";
import { checkDependencies } from "@/lib/dependencies";
import { useEffect, useCallback } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getZodSchemaForStep } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z, ZodError } from "zod";



interface FormRendererProps {
  schema: FormSchema;
  step: number;
  formData: FormDataState;
  updateField: (key: string, value: unknown) => void;
  onValidationChange?: (isValid: boolean, validateFn: () => Promise<boolean>) => void;
}

function getDynamicOptions(field: FieldSchema, formData: FormDataState): string[] {
  if (!field.optionSource) return field.options || [];
  const { key: sourceKey, map } = field.optionSource;
  const sourceValue = formData[sourceKey];
  if (!sourceValue || !map[sourceValue]) return [];
  return map[sourceValue];
}

function DynamicSelectField({
  field,
  control,
  updateField,
  formData,
}: {
  field: FieldSchema;
  control: any;
  updateField: (key: string, value: unknown) => void;
  formData: FormDataState;
}) {
  const options = getDynamicOptions(field, formData);

  return (
    <Controller
      name={field.key}
      control={control}
      rules={{ required: field.required ? `${field.label} is required` : false }}
      render={({ field: rhfField, fieldState }) => (
        <div className="space-y-2">
          <Select
            value={rhfField.value ?? ""}
            onValueChange={(value) => {
              rhfField.onChange(value);
              updateField(field.key, value);
              clearDependentFields(field.key, formData, updateField);
            }}
          >
            <SelectTrigger className={fieldState.error ? "border-red-500" : ""}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt: string) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.error && (
            <p className="mt-1 flex items-center text-sm text-red-600">
              <ExclamationCircleIcon className="mr-1 h-4 w-4" />
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}

function clearDependentFields(
  changedFieldKey: string,
  formData: FormDataState,
  updateField: (key: string, value: unknown) => void
) {
  if (changedFieldKey === "propertyType") {
    updateField("category", "");
    updateField("subCategory", "");
  } else if (changedFieldKey === "category") {
    updateField("subCategory", "");
  }
}

export default function FormRenderer({
  schema,
  step,
  formData,
  updateField,
  onValidationChange,
}: FormRendererProps) {

  const currentStepSchema = getZodSchemaForStep(schema.steps[step].fields);

  const {
    control,
    setValue,
    watch,
    formState: { errors },
    trigger,
  } = useForm({
    defaultValues: formData,
    mode: "onChange",resolver: zodResolver(currentStepSchema),
  });

  useEffect(() => {
    Object.entries(formData).forEach(([key, value]) => {
      setValue(key, value);
    });
  }, [formData, setValue]);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    try {
      // currentStepSchema.parse(formData);
      // return true;
      const valid = await trigger();
      return valid;
    } catch (e) {
      if (e instanceof ZodError) {
        const fieldErrors = e.issues.map((issue) => issue.message).join(", ");
        console.log(formData)
        currentStepSchema.parse(formData)
        alert(`Validation errors: ${fieldErrors}`);
      }
      return false;
    }
  }, [currentStepSchema, formData]);
  

  const getEmptyRequiredFields = useCallback((fields: FieldSchema[], formData: FormDataState): string[] => {
    const emptyFields: string[] = [];

    fields.forEach((field) => {
      if (checkDependencies(field, formData)) {
        if (field.type === "group" && field.fields) {
          emptyFields.push(...getEmptyRequiredFields(field.fields, formData));
        } else if (field.required) {
          const value = formData[field.key];
          if (!value || (typeof value === "string" && value.trim() === "")) {
            emptyFields.push(field.label);
          }
        }
      }
    });

    return emptyFields;
  }, []);

  const getAllFieldKeys = useCallback((fields: FieldSchema[], formData: FormDataState): string[] => {
    const keys: string[] = [];

    fields.forEach((field) => {
      if (checkDependencies(field, formData)) {
        if (field.type === "group" && field.fields) {
          keys.push(...getAllFieldKeys(field.fields, formData));
        } else {
          keys.push(field.key);
        }
      }
    });

    return keys;
  }, []);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(true, validateCurrentStep);
    }
  }, [step, schema.steps[step], formData]); // Remove onValidationChange from deps to prevent infinite loop

  const getFieldError = (fieldKey: string) => {
    return errors[fieldKey];
  };

  const renderField = (field: FieldSchema) => {
    if (!checkDependencies(field, formData)) return null;

    if (field.key === "subCategory" && field.optionSource) {
      const options = getDynamicOptions(field, formData);
      if (options.length === 0) {
        return null;
      }
    }

    if (field.type === "group" && field.fields) {
      return (
        <fieldset
          key={field.key}
          className="border border-gray-300 rounded-md p-5 bg-gray-50"
          aria-labelledby={`${field.key}-legend`}
        >
          <legend
            id={`${field.key}-legend`}
            className="text-lg font-semibold text-gray-700 mb-4"
          >
            {field.label}
          </legend>
          <div className="space-y-6">{field.fields.map((subField) => renderField(subField))}</div>
        </fieldset>
      );
    }

    const error = getFieldError(field.key);

    return (
      <div key={field.key} className="space-y-2">
        <Label
          htmlFor={field.key}
          className="text-sm font-medium text-gray-700 flex items-center"
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
          {error && (
            <ExclamationCircleIcon className="ml-2 h-5 w-5 text-red-500" aria-hidden="true" />
          )}
        </Label>

        {field.type === "select" && field.optionSource ? (
          <DynamicSelectField
            field={field}
            control={control}
            updateField={updateField}
            formData={formData}
          />
        ) : (
          <Controller
            name={field.key}
            control={control}
            rules={{ required: field.required }}
            render={({ field: rhfField, fieldState }) => {
              const options = field.options || [];

              switch (field.type) {
                case "text":
                case "number":
                case "date":
                  return (
                    <>
                      <Input
                        {...rhfField}
                        id={field.key}
                        type={field.type}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        value={String(rhfField.value || "")}
                        onChange={(e) => {
                          rhfField.onChange(e);
                          updateField(field.key, e.target.value);
                        }}
                        className={fieldState.error ? "border-red-500" : ""}
                      />
                      {fieldState.error && (
                        <p className="mt-1 flex items-center text-sm text-red-600">
                          <ExclamationCircleIcon className="mr-1 h-4 w-4" />
                          {getErrorMessage(fieldState.error)}
                        </p>
                      )}
                    </>
                  );

                case "checkbox":
                  return (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={field.key}
                        checked={!!rhfField.value}
                        onCheckedChange={(checked) => {
                          rhfField.onChange(checked);
                          updateField(field.key, checked);
                        }}
                      />
                      <Label 
                        htmlFor={field.key} 
                        className="text-sm font-normal cursor-pointer"
                      >
                        {field.label}
                      </Label>
                    </div>
                  );

                case "select":
                  return (
                    <>
                      <Select
                        value={String(rhfField.value || "")}
                        onValueChange={(value) => {
                          rhfField.onChange(value);
                          updateField(field.key, value);
                          clearDependentFields(field.key, formData, updateField);
                        }}
                      >
                        <SelectTrigger className={fieldState.error ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((opt: string) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.error && (
                        <p className="mt-1 flex items-center text-sm text-red-600">
                          <ExclamationCircleIcon className="mr-1 h-4 w-4" />
                          {getErrorMessage(fieldState.error)}
                        </p>
                      )}
                    </>
                  );

                default:
                  return (
                    <div className="text-sm text-red-600">
                      Unsupported field type: {field.type}
                    </div>
                  );
              }
            }}
          />
        )}
      </div>
    );
  };

  return (
    <form className="space-y-8 max-w-3xl mx-auto p-4 sm:p-8">
      {schema.steps[step].fields.map((field) => renderField(field))}
    </form>
  );
}

function getErrorMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as any).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "This field is required";
}