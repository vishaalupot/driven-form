import { z } from "zod";
import { FieldSchema } from "@/types/schema";

export function getZodSchemaForStep(fields: FieldSchema[]) {
  const schemaObj: Record<string, z.ZodTypeAny> = {};

  fields.forEach(field => {
    let zodField: z.ZodTypeAny;

    // console.log(field.label)


    switch (field.type) {
        case "text":
            if (field.key === "email" || field.key.toLowerCase().includes("email")) {
              zodField = z.string()
                .min(1, { message: getCustomErrorMessage(field.key, field.label, "required") })
                .email({ message: getCustomErrorMessage(field.key, field.label, "invalid") });
            } else if (field.label === "Phone Number" || field.key.toLowerCase().includes("phone")) {
              zodField = z.string()
                .min(1, { message: getCustomErrorMessage(field.key, field.label, "required") })
                .regex(/^\d+$/, { message: "Phone number must contain only digits" }) 
                .length(10, { message: "Phone number must be exactly 10 digits" });     
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
          zodField = getZodSchemaForStep(field.fields);
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
  