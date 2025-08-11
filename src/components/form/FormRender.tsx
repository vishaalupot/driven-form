"use client";

import { Controller, useForm } from "react-hook-form";
import { FieldSchema, FormSchema, FormDataState } from "@/types/schema";
import { checkDependencies } from "@/lib/dependencies";
import { useEffect, useRef, useCallback, useMemo } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getZodSchemaForStep } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodError } from "zod";
import React from "react";

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

const clearDependentFields = (
  changedFieldKey: string,
  formData: FormDataState,
  updateField: (key: string, value: unknown) => void
) => {
  const dependencyMap: Record<string, string[]> = {
    propertyType: ["category", "subCategory"],
    category: ["subCategory"],
    hasParking: ["parkingSpots"],
    countryCode: ["phone", "phoneNumber"] // Add country code dependency
  };
  
  const fieldsToReset = dependencyMap[changedFieldKey];
  if (fieldsToReset) {
    fieldsToReset.forEach(field => {
      // Don't clear the phone field value, just trigger re-validation
      if (changedFieldKey === "countryCode" && (field === "phone" || field === "phoneNumber")) {
        // Trigger validation but don't clear the field
        return;
      }
      updateField(field, "");
    });
  }
};

const DynamicSelectField = React.memo(function DynamicSelectField({
  field,
  control,
  updateField,
  formData,
  triggerValidation,
}: {
  field: FieldSchema;
  control: any;
  updateField: (key: string, value: unknown) => void;
  formData: FormDataState;
  triggerValidation?: () => void;
}) {
  const options = useMemo(() => getDynamicOptions(field, formData), [field, formData]);
  const errorId = `${field.key}-error`;

  return (
    <Controller
      name={field.key}
      control={control}
      render={({ field: rhfField, fieldState }) => (
        <div className="space-y-2">
          <Select
            value={rhfField.value ?? ""}
            onValueChange={(value) => {
              rhfField.onChange(value);
              updateField(field.key, value);
              clearDependentFields(field.key, formData, updateField);
              
              // If this is a country code field, trigger phone validation
              if (field.key === "countryCode" || field.key.toLowerCase().includes('country')) {
                setTimeout(() => {
                  triggerValidation?.();
                }, 100);
              }
            }}
          >
            <SelectTrigger 
              className={`w-full ${fieldState.error ? "border-red-500" : ""}`}
              aria-describedby={fieldState.error ? errorId : undefined}
              aria-invalid={!!fieldState.error}
            >
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
            <div 
              id={errorId}
              aria-live="polite"
              className="mt-1 flex items-center text-sm text-red-600"
              role="alert"
            >
              <ExclamationCircleIcon className="mr-1 h-4 w-4" aria-hidden="true" />
              {fieldState.error.message}
            </div>
          )}
        </div>
      )}
    />
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.field === nextProps.field &&
    prevProps.control === nextProps.control &&
    prevProps.updateField === nextProps.updateField &&
    JSON.stringify(getDynamicOptions(prevProps.field, prevProps.formData)) === 
    JSON.stringify(getDynamicOptions(nextProps.field, nextProps.formData))
  );
});

export default function FormRenderer({
  schema,
  step,
  formData,
  updateField,
  onValidationChange,
}: FormRendererProps) {
  const currentStepSchema = useMemo(
    () => getZodSchemaForStep(schema.steps[step].fields, formData),
    [schema.steps, step, formData]
  );
  
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const {
    control,
    setValue,
    formState: { errors },
    trigger,
  } = useForm({
    defaultValues: formData,
    mode: "onChange",
    resolver: zodResolver(currentStepSchema),
  });

  // Trigger validation when form data changes (especially for phone number validation)
  const triggerPhoneValidation = useCallback(async () => {
    // Find phone fields and trigger their validation
    const phoneFields = schema.steps[step].fields.flatMap(field => {
      if (field.type === "group" && field.fields) {
        return field.fields
          .filter(f => f.key.toLowerCase().includes('phone') || f.label.toLowerCase().includes('phone'))
          .map(f => `${field.key}.${f.key}`);
      }
      return field.key.toLowerCase().includes('phone') || field.label.toLowerCase().includes('phone') 
        ? [field.key] : [];
    });
    
    if (phoneFields.length > 0) {
      await trigger(phoneFields);
    }
  }, [trigger, schema.steps, step]);

  useEffect(() => {
    const errorCount = Object.keys(errors).length;
    
    if (errorCount > 0 && errorSummaryRef.current) {
      const errorMessages = Object.entries(errors)
      .filter(([, error]) => error && typeof error === 'object' && 'message' in error && error.message)
      .map(([field, error]) => {
          const errorObj = error as { message: string };
          return `${field}: ${errorObj.message}`;
        })
        .join('. ');
      
      if (errorMessages) {
        errorSummaryRef.current.textContent = '';
        setTimeout(() => {
          if (errorSummaryRef.current) {
            errorSummaryRef.current.textContent = `${errorCount} validation ${errorCount === 1 ? 'error' : 'errors'} found. ${errorMessages}`;
          }
        }, 100);
      }
    } else if (errorSummaryRef.current) {
      errorSummaryRef.current.textContent = '';
    }
  }, [errors]);

  useEffect(() => {
    Object.entries(formData).forEach(([key, value]) => {
      setValue(key, value);
    });
  }, [formData, setValue]);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    try {
      const valid = await trigger();
      return valid;
    } catch (e) {
      if (e instanceof ZodError) {
        const fieldErrors = e.issues.map((issue) => issue.message).join(", ");
        currentStepSchema.parse(formData)
        alert(`Validation errors: ${fieldErrors}`);
      }
      return false;
    }
  }, [currentStepSchema, formData, trigger]);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(true, validateCurrentStep);
    }
  }, [step, schema.steps[step], formData, onValidationChange, validateCurrentStep]);

  const getFieldError = (fieldKey: string) => {
    const error = errors[fieldKey];
    if (error && typeof error === 'object' && 'message' in error) {
      return error as { message: string };
    }
    return undefined;
  };

  const renderField = (field: FieldSchema, parentKey?: string) => {
    const fieldName = parentKey ? `${parentKey}.${field.key}` : field.key;
    const errorId = `${fieldName}-error`;
    
    if (!checkDependencies(field, formData)) return null;
  
    if (field.key === "subCategory" && field.optionSource) {
      const options = getDynamicOptions(field, formData);
      if (options.length === 0) {
        return null;
      }
    }
  
    if (field.type === "group" && field.fields) {
      const groupError = getFieldError(fieldName);
      const groupErrorId = `${fieldName}-group-error`;
    
      return (
        <fieldset
          key={fieldName}
          className="border border-gray-300 rounded-md p-5 bg-gray-50"
          aria-labelledby={`${field.key}-legend`}
          aria-describedby={groupError ? groupErrorId : undefined}
        >
          <legend
            id={`${field.key}-legend`}
            className="text-lg font-semibold text-gray-700 mb-4"
          >
            {field.label}
            {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </legend>
    
          {groupError && (
            <div 
              id={groupErrorId}
              aria-live="polite"
              className="text-red-600 mb-2"
              role="alert"
            >
              {groupError.message || `Please fill out all required fields in ${field.label}`}
            </div>
          )}
    
          <div className="space-y-6">
            {field.fields.map((subField) => renderField(subField, fieldName))}
          </div>
        </fieldset>
      );
    }
    
    return (
      <div key={field.key} className="space-y-2">
        <Label
          htmlFor={field.key}
          className="text-sm font-medium text-gray-700 flex items-center"
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </Label>
  
        {field.type === "select" && field.optionSource ? (
          <DynamicSelectField
            field={field}
            control={control}
            updateField={updateField}
            formData={formData}
            triggerValidation={triggerPhoneValidation}
          />
        ) : (
          <Controller
            name={fieldName}
            control={control}
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
                          const val = e.target.value;
                          if (field.label === "Phone Number" || field.key.toLowerCase().includes("phone")) {
                            if (/^\d*$/.test(val)) {
                              rhfField.onChange(val);
                              updateField(fieldName, val);
                            }
                          } else {
                            rhfField.onChange(val);
                            updateField(fieldName, val);
                          }
                        }}
                        className={fieldState.error ? "border-red-500" : ""}
                        aria-describedby={fieldState.error ? errorId : undefined}
                        aria-invalid={!!fieldState.error}
                      />

                      {fieldState.error && (
                        <div 
                          id={errorId}
                          aria-live="polite"
                          className="mt-1 flex items-center text-sm text-red-600"
                          role="alert"
                        >
                          <ExclamationCircleIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                          {fieldState.error.message}
                        </div>
                      )}
                    </>
                  );
  
                case "checkbox":
                    return (
                      <div className="flex items-start space-x-2 -mt-2">
                        <Checkbox
                          id={field.key}
                          checked={!!rhfField.value}
                          onCheckedChange={(checked) => {
                            rhfField.onChange(checked);
                            updateField(fieldName, checked);
                            clearDependentFields(field.key, formData, updateField); 
                          }}
                          aria-describedby={fieldState.error ? errorId : undefined}
                          aria-invalid={!!fieldState.error}
                        />
                        <div className="flex-1">
                          {fieldState.error && (
                            <div 
                              id={errorId}
                              aria-live="polite"
                              className="flex items-center text-sm text-red-600"
                              role="alert"
                            >
                              <ExclamationCircleIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                              {fieldState.error.message}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                
                case "select":
                  return (
                    <>
                      <Select
                        value={String(rhfField.value || "")}
                        onValueChange={(value) => {
                          rhfField.onChange(value);
                          updateField(fieldName, value);
                          clearDependentFields(field.key, formData, updateField);
                          
                          // If this is a country code field, trigger phone validation
                          if (field.key === "countryCode" || field.key.toLowerCase().includes('country')) {
                            setTimeout(() => {
                              triggerPhoneValidation();
                            }, 100);
                          }
                        }}
                      >
                        <SelectTrigger 
                          className={`w-full ${fieldState.error ? "border-red-500" : ""}`}
                          aria-describedby={fieldState.error ? errorId : undefined}
                          aria-invalid={!!fieldState.error}
                        >
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
                        <div 
                          id={errorId}
                          aria-live="polite"
                          className="mt-1 flex items-center text-sm text-red-600"
                          role="alert"
                        >
                          <ExclamationCircleIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                          {fieldState.error.message}
                        </div>
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
    <div>
      <div 
        ref={errorSummaryRef}
        aria-live="polite"
        className="sr-only"
        aria-atomic="true"
      />
      
      <form className="space-y-8 max-w-3xl mx-auto">
        {schema.steps[step].fields.map((field) => renderField(field))}
      </form>
    </div>
  );
}