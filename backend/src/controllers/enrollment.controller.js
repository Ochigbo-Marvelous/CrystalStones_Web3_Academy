const asyncHandler = require("../utils/asyncHandler");
const enrollmentService = require("../services/enrollment.service");

const enrollInCourse = asyncHandler(async (req, res) => {
  const courseId = Number(req.params.courseId);
  const userId = req.user.id;

  const enrollment = await enrollmentService.enrollInCourse(userId, courseId);

  res.status(201).json({
    success: true,
    message: "Successfully enrolled in course",
    data: enrollment,
  });
});

const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await enrollmentService.getUserEnrollments(req.user.id);

  res.status(200).json({
    success: true,
    results: enrollments.length,
    data: enrollments,
  });
});

const getEnrollment = asyncHandler(async (req, res) => {
  const courseId = Number(req.params.courseId);
  const enrollment = await enrollmentService.getEnrollment(req.user.id, courseId);

  res.status(200).json({
    success: true,
    data: enrollment,
  });
});

module.exports = {
  enrollInCourse,
  getMyEnrollments,
  getEnrollment,
};