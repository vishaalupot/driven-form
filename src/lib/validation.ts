import { z } from "zod";
import { FieldSchema } from "@/types/schema";

export function getZodSchemaForStep(fields: FieldSchema[]) {
  const schemaObj: Record<string, z.ZodTypeAny> = {};

  fields.forEach(field => {
    let zodField: z.ZodTypeAny;

    switch (field.type) {
      case "text":
        // Check if this is an email field and apply appropriate validation
        if (field.key === "email" || field.key.toLowerCase().includes("email")) {
          zodField = z.string()
            .min(1, { message: getCustomErrorMessage(field.key, field.label, "required") })
            .email({ message: getCustomErrorMessage(field.key, field.label, "invalid") });
        } else {
          zodField = z.string()
            .min(1, { message: getCustomErrorMessage(field.key, field.label, "required") });
        }
        break;

      case "number":
        zodField = z.string()
          .min(1, { message: getCustomErrorMessage(field.key, field.label, "required") })
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
          z.boolean()
            .refine((val) => val === true, {
              message: getCustomErrorMessage(field.key, field.label, "required")
            })
        );
        break;

      case "group":
        if (field.fields) {
          zodField = getZodSchemaForStep(field.fields);
        } else {
          zodField = z.object({});
        }
        break;

      default:
        zodField = z.string().optional();
    }

    // Make field optional if not required, but handle undefined/null values
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
      // For required fields, transform undefined/null to empty string for validation
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

function getCustomErrorMessage(fieldKey: string, fieldLabel: string, errorType: "required" | "invalid"): string {
  // Custom messages for specific fields
  const customMessages: Record<string, Record<string, string>> = {
    email: {
      required: "Please enter your email address",
      invalid: "Please enter a valid email address",
    },
    phone: {
      required: "Phone number is required",
      invalid: "Please enter a valid phone number",
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
    }
  };

  // Return custom message if available
  if (customMessages[fieldKey]?.[errorType]) {
    return customMessages[fieldKey][errorType];
  }

  // Fallback messages
  if (errorType === "required") {
    return `${fieldLabel} is required`;
  } else {
    return `Please enter a valid ${fieldLabel.toLowerCase()}`;
  }
}