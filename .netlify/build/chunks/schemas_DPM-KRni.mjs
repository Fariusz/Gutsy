import { z } from 'zod';

const CreateLogSchema = z.object({
  log_date: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }),
  notes: z.string().optional(),
  ingredients: z.array(z.string()),
  symptoms: z.array(
    z.object({
      symptom_id: z.number(),
      severity: z.number().min(1).max(5)
    })
  )
});
const LogsQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.string().transform(Number).optional(),
  page: z.coerce.number().min(1).default(1),
  per_page: z.coerce.number().min(1).max(100).default(10)
});
const TriggersQuerySchema = z.object({
  start_date: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "Invalid start date format"
  }),
  end_date: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "Invalid end date format"
  }),
  limit: z.preprocess(Number, z.number().int().min(1).max(50)).default(10)
});
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Message content cannot be empty")
});
const ResponseFormatSchema = z.object({
  type: z.literal("json_schema"),
  json_schema: z.object({
    name: z.string().min(1, "Schema name is required"),
    strict: z.boolean(),
    schema: z.record(z.any()).refine((schema) => typeof schema === "object" && schema !== null, {
      message: "Schema must be a valid JSON object"
    })
  })
});
const ModelParametersSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(32768).optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional()
}).strict();
const ChatRequestSchema = z.object({
  model: z.string().min(1, "Model name is required"),
  messages: z.array(MessageSchema).min(1, "At least one message is required"),
  systemMessage: z.string().optional(),
  responseFormat: ResponseFormatSchema.optional(),
  parameters: ModelParametersSchema.optional()
}).strict();
const ChatResponseChoiceSchema = z.object({
  message: z.object({
    role: z.string(),
    content: z.string()
  }),
  finish_reason: z.string()
});
const ChatResponseUsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number()
});
const ChatResponseSchema = z.object({
  id: z.string(),
  model: z.string(),
  choices: z.array(ChatResponseChoiceSchema),
  usage: ChatResponseUsageSchema
});
const OpenRouterErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    type: z.string().optional()
  })
});
const ModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  pricing: z.object({
    prompt: z.string(),
    completion: z.string()
  })
});
const ModelsResponseSchema = z.object({
  data: z.array(ModelSchema)
});

export { ChatRequestSchema as C, LogsQuerySchema as L, ModelsResponseSchema as M, OpenRouterErrorSchema as O, TriggersQuerySchema as T, ChatResponseSchema as a, CreateLogSchema as b };
