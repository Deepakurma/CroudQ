import { z } from "zod";

export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    errors?: Record<string, string>;
}

export const validateSchema = <T>(
    schema: z.ZodSchema<T>,
    data: unknown
): ValidationResult<T> => {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const newErrors: Record<string, string> = {};

    // Handle Zod error structure safely (checking for both .errors and .issues)
    const issues = (result.error as any).errors || (result.error as any).issues || [];

    if (Array.isArray(issues)) {
        issues.forEach((e: any) => {
            if (e.path[0]) {
                // Only set the first error for a field if multiple exist
                const fieldName = e.path[0] as string;
                if (!newErrors[fieldName]) {
                    newErrors[fieldName] = e.message;
                }
            }
        });
    }

    return { success: false, errors: newErrors };
};
