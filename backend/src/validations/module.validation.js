const { z } = require("zod");

const createModuleSchema = z.object({
  body: z.object({
    course_id: z.number({ required_error: "Course ID is required" }),
    title: z
      .string({ required_error: "Title is required" })
      .min(3, "Title must be at least 3 characters")
      .max(200),
    description: z.string().optional(),
    order_index: z.number().int().min(0).optional().default(0),
  }),
});

const updateModuleSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().optional(),
    order_index: z.number().int().min(0).optional(),
  }),
});

module.exports = {
  createModuleSchema,
  updateModuleSchema,
};