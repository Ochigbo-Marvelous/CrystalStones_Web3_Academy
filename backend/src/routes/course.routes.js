const express = require("express");
const courseController = require("../controllers/course.controller");
const validate = require("../middlewares/validate");
const { createCourseSchema, updateCourseSchema } = require("../validations/course.validation");
const { protect } = require("../middlewares/auth");
const { adminOnly } = require("../middlewares/admin");

const router = express.Router();


router.get("/", courseController.getAllCourses);
router.get("/slug/:slug", courseController.getCourseBySlug);
router.get("/:id", courseController.getCourse);


router.post("/", protect, adminOnly, validate(createCourseSchema), courseController.createCourse);
router.patch("/:id", protect, adminOnly, validate(updateCourseSchema), courseController.updateCourse);
router.delete("/:id", protect, adminOnly, courseController.deleteCourse);

module.exports = router;