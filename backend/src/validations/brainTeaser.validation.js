const { z } = require("zod");

const createBrainTeaserSchema = z.object({
  body: z.object({
    module_id: z.number({ required_error: "Module ID is required" }),
    question: z
      .string({ required_error: "Question is required" })
      .min(5, "Question must be at least 5 characters"),
    option_a: z.string({ required_error: "Option A is required" }),
    option_b: z.string({ required_error: "Option B is required" }),
    option_c: z.string({ required_error: "Option C is required" }),
    option_d: z.string({ required_error: "Option D is required" }),
    correct_option: z.enum(["a", "b", "c", "d"], {
      required_error: "Correct option is required",
    }),
    order_index: z.number().int().min(0).optional().default(0),
  }),
});

const updateBrainTeaserSchema = z.object({
  body: z.object({
    question: z.string().min(5).optional(),
    option_a: z.string().optional(),
    option_b: z.string().optional(),
    option_c: z.string().optional(),
    option_d: z.string().optional(),
    correct_option: z.enum(["a", "b", "c", "d"]).optional(),
    order_index: z.number().int().min(0).optional(),
  }),
});

module.exports = {
  createBrainTeaserSchema,
  updateBrainTeaserSchema,
};