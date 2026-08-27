const { z } = require("zod");

const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().min(2).max(100).optional(),
    avatar: z
      .string()
      .max(255)
      .regex(
        /^(https?:\/\/[a-zA-Z0-9.-]+(?::\d+)?(?:\/[\w.~-]*)*|^\/uploads\/[\w.-]+)$/,
        "Avatar must be a valid URL or local upload path"
      )
      .optional()
      .or(z.literal(""))
      .or(z.null()),
  }),
});

const changePasswordSchema = z.object({
  body: z
    .object({
      current_password: z.string({ required_error: "Current password is required" }),
      new_password: z
        .string({ required_error: "New password is required" })
        .min(8, "New password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
      confirm_password: z.string({ required_error: "Please confirm your new password" }),
    })
    .refine((data) => data.new_password === data.confirm_password, {
      message: "Passwords do not match",
      path: ["confirm_password"],
    }),
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
};