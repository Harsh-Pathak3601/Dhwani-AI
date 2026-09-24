import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * ─── ZOD VALIDATION MIDDLEWARE ───
 * Validates incoming request bodies against a Zod schema.
 * Strips unknown fields and replaces req.body with the parsed, type-safe data.
 * Returns 400 with structured error details if validation fails.
 */
export const validate = (schema: ZodSchema) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = (result.error as ZodError).flatten();
    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.fieldErrors
    });
    return;
  }
  req.body = result.data;
  next();
};
