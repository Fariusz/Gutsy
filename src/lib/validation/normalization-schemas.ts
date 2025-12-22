import { z } from "zod";

/**
 * Validation schema for ingredient normalization requests
 * Ensures raw text is valid, properly sized, and contains meaningful content
 */
export const NormalizeIngredientSchema = z.object({
  raw_text: z
    .string({
      required_error: "Raw text is required",
      invalid_type_error: "Raw text must be a string",
    })
    .min(1, "Raw text cannot be empty")
    .max(100, "Raw text cannot exceed 100 characters")
    .trim()
    .refine((text) => text.length > 0, "Raw text cannot be only whitespace")
    .refine((text) => /[a-zA-Z]/.test(text), "Raw text must contain at least one letter"),
});

/**
 * Type inference for the validation schema
 */
export type NormalizeIngredientInput = z.infer<typeof NormalizeIngredientSchema>;
