const { z } = require("zod");

const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().trim().min(2).max(100).optional(),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(24, "Username must be at most 24 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and _")
      .optional(),
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

const sendEmailCodeSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Enter a valid email"),
  }),
});

const changeEmailSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Enter a valid email"),
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  }),
});

const deleteAccountSchema = z.object({
  body: z.object({
    password: z.string().optional(),
    confirm: z.string().optional(),
  }),
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  sendEmailCodeSchema,
  changeEmailSchema,
  deleteAccountSchema,
};