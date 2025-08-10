import { z, ZodType, ZodString, ZodBoolean, ZodObject } from "zod";
import { FieldSchema } from "@/types/schema";

function getZodSchemaForField(field: FieldSchema): ZodType<any> {
  switch (field.type) {
    case "text": {
      let schema: ZodString = z.string();
      if (field.key.toLowerCase().includes("email")) {
        schema = schema.email({ message: "Invalid email address" });
      }
      if (field.required) {
        schema = schema.nonempty({ message: `${field.label} is required` });
      }
      return schema;
    }

    case "number": {
      let schema = z
        .union([z.number(), z.string().regex(/^\d+$/, "Must be a number")])
        .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val));
      if (field.required) {
        schema = schema.refine((val) => !isNaN(val), { message: `${field.label} must be a number` });
      }
      return schema;
    }

    case "date": {
      let schema: ZodString = z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" });
      if (field.required) {
        schema = schema.nonempty({ message: `${field.label} is required` });
      }
      return schema;
    }

    case "checkbox": {
      let schema: ZodBoolean = z.boolean();
      if (field.required) {
        schema = schema.refine((val: boolean) => val === true, {
          message: `${field.label} must be checked`,
        });
      }
      return schema;
    }

    case "select": {
      let schema: ZodString = z.string();
      if (field.required) {
        schema = schema.nonempty({ message: `${field.label} is required` });
      }
      return schema;
    }

    case "group": {
        if (field.fields) {
          const shape: Record<string, ZodType<any>> = {};
          field.fields.forEach((subField) => {
            shape[subField.key] = getZodSchemaForField(subField);
          });
          let schema = z.object(shape);
          
          if (!field.required) {
            return schema.optional(); 
          }

          
          
          return schema;
        } else {
          return z.any();
        }
      }

    default:
      return z.any();
  }
}

export function getZodSchemaForStep(fields: FieldSchema[]) {
  const shape: Record<string, ZodType<any>> = {};
  fields.forEach((field) => {
    shape[field.key] = getZodSchemaForField(field);
  });
  return z.object(shape);
}
