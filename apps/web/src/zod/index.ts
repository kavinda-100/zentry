import { z } from 'zod';

const responseBaseSchema = {
  status_code: z.number().int().nonnegative(),
  message: z.string(),
};

export const createOkResponseSchema = <TData extends z.ZodType>(dataSchema: TData) =>
  z.object({
    success: z.literal(true),
    ...responseBaseSchema,
    data: dataSchema,
  });

export const createErrorResponseSchema = <TData extends z.ZodType>(dataSchema: TData) =>
  z.object({
    success: z.literal(false),
    ...responseBaseSchema,
    data: dataSchema,
  });
