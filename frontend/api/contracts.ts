import { z } from 'zod';

const uuidSchema = z.string().uuid();
const dateSchema = z.iso.date();
const dateTimeSchema = z.iso.datetime({ local: true });

export const quickCheckActionSchema = z.enum([
  'EXERCISE',
  'MAKEUP',
  'CLEANSING',
  'SKINCARE',
  'HEAT',
]);

export const decisionSchema = z.enum([
  'POSSIBLE',
  'ADJUST',
  'POSTPONE',
  'CONNECT',
]);

const nextActionSchema = z
  .object({
    type: z.string(),
    label: z.string(),
  })
  .strict();

const contextSchema = z.record(z.string(), z.string());

export const sessionSchema = z
  .object({
    session_id: uuidSchema,
    procedure: z.string().min(1),
    procedure_at: dateSchema,
    clinic_id: z.string().nullable(),
    status: z.enum(['ACTIVE', 'COMPLETED']),
    elapsed_day: z.number().int().nonnegative(),
    created_at: dateTimeSchema,
  })
  .strict();

export const askResponseSchema = z
  .object({
    interaction_id: z.number().int().positive(),
    session_id: uuidSchema,
    status: z.enum([
      'MATCHED',
      'CLARIFY',
      'CONNECT',
      'NO_PROTOCOL',
      'GENERAL',
      'UNSUPPORTED',
    ]),
    action: quickCheckActionSchema.nullable(),
    context: contextSchema.nullable(),
    decision: decisionSchema.nullable(),
    guidance: z.string().nullable(),
    message: z.string().nullable(),
    next_action: nextActionSchema.nullable(),
    protocol_ref: z.string().nullable(),
    photo_record_ids: z.array(z.number().int().positive()),
    created_at: dateTimeSchema,
  })
  .strict();

export const quickCheckResponseSchema = z
  .object({
    check_id: uuidSchema,
    session_id: uuidSchema,
    elapsed_day: z.number().int().nonnegative(),
    action: quickCheckActionSchema,
    context: contextSchema,
    status: z.enum(['MATCHED', 'NO_PROTOCOL']),
    decision: decisionSchema.nullable(),
    guidance: z.string().nullable(),
    next_action: nextActionSchema.nullable(),
    protocol_ref: z.string().nullable(),
    created_at: dateTimeSchema,
  })
  .strict();

function successEnvelopeSchema<T extends z.ZodType>(dataSchema: T) {
  return z
    .object({
      success: z.literal(true),
      data: dataSchema,
      message: z.null(),
    })
    .strict();
}

export const sessionEnvelopeSchema = successEnvelopeSchema(sessionSchema);
export const askEnvelopeSchema = successEnvelopeSchema(askResponseSchema);
export const quickCheckEnvelopeSchema = successEnvelopeSchema(
  quickCheckResponseSchema,
);

export type SessionWire = z.infer<typeof sessionSchema>;
export type AskResponseWire = z.infer<typeof askResponseSchema>;
export type QuickCheckResponseWire = z.infer<typeof quickCheckResponseSchema>;
export type QuickCheckActionWire = z.infer<typeof quickCheckActionSchema>;

export type CreateSessionInput = {
  readonly procedure: string;
  readonly procedure_at: string;
  readonly clinic_id: string | null;
};

export type AskInput = {
  readonly question: string;
  readonly photo_record_ids: readonly number[];
};

export type QuickCheckInput = {
  readonly action: QuickCheckActionWire;
  readonly context: Readonly<Record<string, string>>;
};
