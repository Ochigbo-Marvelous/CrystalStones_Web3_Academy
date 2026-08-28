const { z } = require("zod");

const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one symbol");

const emailBody = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
});

const signupSchema = z.object({
  body: z
    .object({
      full_name: z.string().min(2).max(100),
      username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
      email: z.string().email().transform((value) => value.trim().toLowerCase()),
      password: passwordSchema,
      confirm_password: z.string(),
      email_ticket: z.string().min(20, "Verify your email first"),
    })
    .refine((data) => data.password === data.confirm_password, {
      message: "Passwords do not match",
      path: ["confirm_password"],
    }),
});

const loginSchema = z.object({
  body: z.object({
    login: z.string().min(3),
    password: z.string().min(1),
  }),
});

const sendEmailCodeSchema = z.object({ body: emailBody });

const verifyEmailCodeSchema = z.object({
  body: emailBody.extend({
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  }),
});

const resetPasswordSchema = z.object({
  body: emailBody
    .extend({
      code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
      new_password: passwordSchema,
      confirm_password: z.string(),
    })
    .refine((data) => data.new_password === data.confirm_password, {
      message: "Passwords do not match",
      path: ["confirm_password"],
    }),
});

module.exports = {
  signupSchema,
  loginSchema,
  sendEmailCodeSchema,
  verifyEmailCodeSchema,
  resetPasswordSchema,
};