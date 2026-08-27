const { z } = require("zod");

const createLessonSchema = z.object({
  body: z.object({
    module_id: z.number({ required_error: "Module ID is required" }),
    title: z
      .string({ required_error: "Title is required" })
      .min(3, "Title must be at least 3 characters")
      .max(200),
    content: z.string().optional(),
    video_url: z.string().url().optional().or(z.literal("")),
    order_index: z.number().int().min(0).optional().default(0),
    duration_minutes: z.number().int().min(0).optional().default(0),
  }),
});

const updateLessonSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    content: z.string().optional(),
    video_url: z.string().url().optional().or(z.literal("")),
    order_index: z.number().int().min(0).optional(),
    duration_minutes: z.number().int().min(0).optional(),
  }),
});

module.exports = {
  createLessonSchema,
  updateLessonSchema,
};