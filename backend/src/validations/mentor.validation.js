const { z } = require("zod");

const askMentorSchema = z.object({
  body: z.object({
    question: z
      .string({ required_error: "Question is required" })
      .trim()
      .min(3, "Please ask a proper question")
      .max(500, "Question must be 500 characters or less"),
  }),
});

module.exports = { askMentorSchema };