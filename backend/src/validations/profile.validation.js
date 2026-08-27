const { z } = require("zod");

const isAllowedAvatar = (value) => {
  if (!value) return true;
  if (value.startsWith("/uploads/")) return /^\/uploads\/[\w.-]+$/.test(value);
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().min(2).max(100).optional(),
    avatar: z
      .string()
      .max(255)
      .optional()
      .or(z.literal(""))
      .or(z.null())
      .refine(isAllowedAvatar, "Avatar must be an https URL or /uploads/ path"),
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
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one symbol"),
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