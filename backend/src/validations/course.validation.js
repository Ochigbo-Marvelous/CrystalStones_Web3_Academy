const { z } = require("zod");

const createCourseSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: "Title is required" })
      .min(3, "Title must be at least 3 characters")
      .max(200),
    description: z.string().optional(),
    level: z.enum(["beginner", "intermediate", "advanced"], {
      required_error: "Level is required",
    }),
    is_paid: z.boolean().optional().default(false),
    price_usd: z.number().min(0).optional().default(0),
    thumbnail: z.string().optional(),
  }),
});

const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().optional(),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    is_paid: z.boolean().optional(),
    price_usd: z.number().min(0).optional(),
    thumbnail: z.string().optional(),
    is_published: z.boolean().optional(),
  }),
});

module.exports = {
  createCourseSchema,
  updateCourseSchema,
};