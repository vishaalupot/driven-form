// Updated validation.ts
import { z } from "zod";
import { FieldSchema, FormDataState } from "@/types/schema";

// Country code to digit mapping
const COUNTRY_CODE_DIGITS: Record<string, number> = {
  "+966": 7,  // Saudi Arabia
  "+1": 10,   // US/Canada
  "+44": 11,  // UK
  "+971": 9,  // UAE
};

export function getZodSchemaForStep(fields: FieldSchema[], formData?: FormDataState) {
  const schemaObj: Record<string, z.ZodTypeAny> = {};

  fields.forEach(field => {
    let zodField: z.ZodTypeAny;

    switch (field.type) {
      case "text":
        if (field.key === "email" || field.key.toLowerCase().includes("email")) {
          zodField = z.string()
            .min(1, { message: getCustomErrorMessage(field.key, field.label, "required") })
            .email({ message: getCustomErrorMessage(field.key, field.label, "invalid") });
        } else if (field.label === "Phone Number" || field.key.toLowerCase().includes("phone")) {
          // Dynamic phone validation based on country code
          zodField = createDynamicPhoneValidation(field, formData);
        } else {
          zodField = z.string()
            .min(1, { message: getCustomErrorMessage(field.key, field.label, "required") });
        }
        break;
          
      case "number":
        zodField = z.string()
          .min(1, {
             message: getCustomErrorMessage(field.key, field.label, "required") 
            })
          .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
            message: getCustomErrorMessage(field.key, field.label, "invalid")
          });
        break;

      case "date":
        zodField = z.string()
          .min(1, { message: getCustomErrorMessage(field.key, field.label, "required") });
        break;

      case "select":
        zodField = z.string()
          .min(1, { message: getCustomErrorMessage(field.key, field.label, "required") });
        break;

      case "checkbox":
        zodField = z.preprocess(
          (val) => val === undefined || val === null ? false : val,
          field.required 
            ? z.boolean().refine((val) => val === true, {
                message: getCustomErrorMessage(field.key, field.label, "required")
              })
            : z.boolean()
        );
        break;

      case "group":
        if (field.fields) {
          zodField = getZodSchemaForStep(field.fields, formData);
        } else {
          zodField = z.object({});
        }
        break;

      default:
        zodField = z.string().optional();
    }

    if (!field.required) {
      if (field.type === "checkbox") {
        zodField = zodField.optional();
      } else {
        zodField = z.union([
          zodField,
          z.literal(""),
          z.literal(undefined),
          z.literal(null)
        ]).optional();
      }
    } else {
      if (field.type !== "checkbox" && field.type !== "group") {
        zodField = z.preprocess((val) => {
          if (val === undefined || val === null) return "";
          return val;
        }, zodField);
      }
    }

    schemaObj[field.key] = zodField;
  });

  return z.object(schemaObj);
}

function createDynamicPhoneValidation(field: FieldSchema, formData?: FormDataState) {
  return z.string()
    .min(1, { message: getCustomErrorMessage(field.key, field.label, "required") })
    .regex(/^\d+$/, { message: "Phone number must contain only digits" })
    .superRefine((val, ctx) => {
      if (!formData) return;
      
      // Look for country code in the same group or at the root level
      const countryCode = findCountryCodeInFormData(formData, field.key);
      
      if (countryCode && COUNTRY_CODE_DIGITS[countryCode]) {
        const requiredDigits = COUNTRY_CODE_DIGITS[countryCode];
        if (val.length !== requiredDigits) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Phone number must be exactly ${requiredDigits} digits for ${countryCode}`
          });
        }
      } else {
        // Default validation if no country code found
        if (val.length < 7 || val.length > 15) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Phone number must be between 7 and 15 digits"
          });
        }
      }
    });
}

function findCountryCodeInFormData(formData: FormDataState, phoneFieldKey: string): string | null {
  // First, try to find a country code field in the same group
  const fieldParts = phoneFieldKey.split('.');
  if (fieldParts.length > 1) {
    // If phone is in a group, look for countryCode in the same group
    const groupPath = fieldParts.slice(0, -1).join('.');
    const countryCodeKey = `${groupPath}.countryCode`;
    if (formData[countryCodeKey]) {
      return formData[countryCodeKey] as string;
    }
  }
  
  // Look for countryCode at the root level
  if (formData.countryCode) {
    return formData.countryCode as string;
  }
  
  // Look for any field that might contain country code
  for (const [key, value] of Object.entries(formData)) {
    if (key.toLowerCase().includes('country') && typeof value === 'string' && value.startsWith('+')) {
      return value;
    }
  }
  
  return null;
}

function getCustomErrorMessage(
  fieldKey: string,
  fieldLabel: string,
  errorType: "required" | "invalid" | "onlyNumbers" | "length10"
): string {
  const customMessages: Record<string, Record<string, string>> = {
    email: {
      required: "Please enter your email address",
      invalid: "Please enter a valid email address",
    },
    password: {
      required: "Password is required",
      invalid: "Password must be at least 8 characters long",
    },
    firstName: {
      required: "First name is required",
      invalid: "Please enter a valid first name",
    },
    lastName: {
      required: "Last name is required",
      invalid: "Please enter a valid last name",
    },
    propertyType: {
      required: "Please select a property type",
    },
    category: {
      required: "Please select a category",
    },
    subCategory: {
      required: "Please select a subcategory",
    },
    price: {
      required: "Price is required",
      invalid: "Please enter a valid price",
    },
    date: {
      required: "Date is required",
      invalid: "Please enter a valid date",
    },
    phone: {
      required: "Phone number is required",
      onlyNumbers: "Phone number must contain only numbers",
      length10: "Phone number must be exactly 10 digits",
    },
  };

  if (customMessages[fieldKey]?.[errorType]) {
    return customMessages[fieldKey][errorType];
  }

  switch (errorType) {
    case "required":
      return `${fieldLabel} is required`;
    case "onlyNumbers":
      return `${fieldLabel} must contain only numbers`;
    case "length10":
      return `${fieldLabel} must be exactly 10 digits`;
    default:
      return `Please enter a valid ${fieldLabel.toLowerCase()}`;
  }
}