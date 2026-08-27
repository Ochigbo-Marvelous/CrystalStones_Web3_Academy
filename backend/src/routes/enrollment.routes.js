const express = require("express");
const enrollmentController = require("../controllers/enrollment.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

// All enrollment routes require login
router.use(protect);

router.post("/:courseId", enrollmentController.enrollInCourse);
router.get("/me", enrollmentController.getMyEnrollments);
router.get("/:courseId", enrollmentController.getEnrollment);

module.exports = router;