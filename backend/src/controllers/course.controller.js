const asyncHandler = require("../utils/asyncHandler");
const courseService = require("../services/course.service");

const createCourse = asyncHandler(async (req, res) => {
  const course = await courseService.createCourse(req.body);

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    data: course,
  });
});

const getAllCourses = asyncHandler(async (req, res) => {
  const filters = {
    level: req.query.level,
  };

  const courses = await courseService.getAllCourses(filters);

  res.status(200).json({
    success: true,
    results: courses.length,
    data: courses,
  });
});

const getCourse = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseById(req.params.id);

  res.status(200).json({
    success: true,
    data: course,
  });
});

const getCourseBySlug = asyncHandler(async (req, res) => {
  const course = await courseService.getCourseBySlug(req.params.slug);

  res.status(200).json({
    success: true,
    data: course,
  });
});

const updateCourse = asyncHandler(async (req, res) => {
  const course = await courseService.updateCourse(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: "Course updated successfully",
    data: course,
  });
});

const deleteCourse = asyncHandler(async (req, res) => {
  const result = await courseService.deleteCourse(req.params.id);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

module.exports = {
  createCourse,
  getAllCourses,
  getCourse,
  getCourseBySlug,
  updateCourse,
  deleteCourse,
};