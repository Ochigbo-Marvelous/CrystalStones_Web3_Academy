const ApiError = require("../utils/ApiError");

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    console.log("Validation Error:", error); // ← This will show in terminal

    const errors =
      error.errors?.map((err) => ({
        path: err.path?.join(".") || "unknown",
        message: err.message,
      })) || [{ message: error.message }];

    return next(new ApiError(400, "Validation failed", errors));
  }
};

module.exports = validate;