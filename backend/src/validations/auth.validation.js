const { z } = require("zod");

const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const signupSchema = z.object({
  body: z
    .object({
      full_name: z
        .string({ required_error: "Full name is required" })
        .min(2, "Full name must be at least 2 characters")
        .max(100),
      username: z
        .string({ required_error: "Username is required" })
        .min(3, "Username must be at least 3 characters")
        .max(50)
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
      email: z
        .string({ required_error: "Email is required" })
        .email("Invalid email address"),
      password: passwordSchema,
      confirm_password: z.string({ required_error: "Please confirm your password" }),
    })
    .refine((data) => data.password === data.confirm_password, {
      message: "Passwords do not match",
      path: ["confirm_password"],
    }),
});

const loginSchema = z.object({
  body: z.object({
    login: z
      .string({ required_error: "Username or email is required" })
      .min(3, "Invalid login credentials"),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
  }),
});

module.exports = {
  signupSchema,
  loginSchema,
};