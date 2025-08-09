"use client";

import { Controller, useForm } from "react-hook-form";
import { FieldSchema, FormSchema, FormDataState } from "@/types/schema";
import { checkDependencies } from "@/lib/dependencies";
import { useEffect } from "react";
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";

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
        <div className="relative">
          <select
            {...rhfField}
            className={`peer block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder-gray-400
              focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
              ${fieldState.error ? "border-red-500 text-red-700" : ""}
              appearance-none`}
            value={rhfField.value ?? ""}
            onChange={(e) => {
              const newValue = e.target.value;
              rhfField.onChange(e);
              updateField(field.key, newValue);
              clearDependentFields(field.key, formData, updateField);
            }}
          >
            <option value="">Select...</option>
            {options.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
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
  const {
    control,
    setValue,
    watch,
    formState: { errors },
    trigger,
  } = useForm({
    defaultValues: formData,
    mode: "onChange",
  });

  const watchedValues = watch();

  useEffect(() => {
    Object.entries(formData).forEach(([key, value]) => {
      setValue(key, value);
    });
  }, [formData, setValue]);

  const validateCurrentStep = async (): Promise<boolean> => {
    const currentStepFields = schema.steps[step].fields;
    const fieldsToValidate = getAllFieldKeys(currentStepFields, formData);

    const isValid = await trigger(fieldsToValidate);

    if (!isValid) {
      const emptyRequiredFields = getEmptyRequiredFields(currentStepFields, formData);
      if (emptyRequiredFields.length > 0) {
        const fieldNames = emptyRequiredFields.join(", ");
        alert(`Please fill in the following required fields: ${fieldNames}`);
      }
    }

    return isValid;
  };

  const getEmptyRequiredFields = (fields: FieldSchema[], formData: FormDataState): string[] => {
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
  };

  const getAllFieldKeys = (fields: FieldSchema[], formData: FormDataState): string[] => {
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
  };

  useEffect(() => {
    onValidationChange?.(true, validateCurrentStep);
  }, [step, schema, onValidationChange]);

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
      <div key={field.key} className="space-y-1">
        <label
          htmlFor={field.key}
          className="block text-sm font-medium text-gray-700 flex items-center"
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
          {error && (
            <ExclamationCircleIcon className="ml-2 h-5 w-5 text-red-500" aria-hidden="true" />
          )}
        </label>

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
                    <input
                      {...rhfField}
                      id={field.key}
                      type={field.type}
                      className={`block w-full rounded-md border px-3 py-2 text-sm
                      shadow-sm placeholder-gray-400
                      focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                      ${
                        fieldState.error
                          ? "border-red-500 text-red-700 focus:ring-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={rhfField.value ?? ""}
                      onChange={(e) => {
                        rhfField.onChange(e);
                        updateField(field.key, e.target.value);
                      }}
                    />
                  );

                case "checkbox":
                  return (
                    <div className="flex items-center">
                      <input
                        {...rhfField}
                        id={field.key}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={!!rhfField.value}
                        onChange={(e) => {
                          rhfField.onChange(e.target.checked);
                          updateField(field.key, e.target.checked);
                        }}
                      />
                      <label htmlFor={field.key} className="ml-2 block text-sm text-gray-700">
                        {field.label}
                      </label>
                    </div>
                  );

                case "select":
                  return (
                    <select
                      {...rhfField}
                      id={field.key}
                      className={`block w-full rounded-md border px-3 py-2 text-sm
                      shadow-sm
                      focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                      ${
                        fieldState.error
                          ? "border-red-500 text-red-700 focus:ring-red-500"
                          : "border-gray-300"
                      }`}
                      value={rhfField.value ?? ""}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        rhfField.onChange(e);
                        updateField(field.key, newValue);
                        clearDependentFields(field.key, formData, updateField);
                      }}
                    >
                      <option value="">Select...</option>
                      {options.map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
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

        {error && (
            <p className="mt-1 flex items-center text-sm text-red-600">
                <ExclamationCircleIcon className="mr-1 h-4 w-4" />
                {getErrorMessage(error)}
            </p>
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
  