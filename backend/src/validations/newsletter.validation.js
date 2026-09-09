
const { z } = require("zod");

const subscribeSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Enter a valid email")
      .max(120),
  }),
});

module.exports = { subscribeSchema };