const express = require("express");
const lessonController = require("../controllers/lesson.controller");
const validate = require("../middlewares/validate");
const { createLessonSchema, updateLessonSchema } = require("../validations/lesson.validation");
const { protect } = require("../middlewares/auth");
const { adminOnly } = require("../middlewares/admin");

const router = express.Router();

router.get("/module/:moduleId", lessonController.getLessonsByModule);
router.get("/:id", lessonController.getLesson);

router.post("/", protect, adminOnly, validate(createLessonSchema), lessonController.createLesson);
router.patch("/:id", protect, adminOnly, validate(updateLessonSchema), lessonController.updateLesson);
router.delete("/:id", protect, adminOnly, lessonController.deleteLesson);

module.exports = router;