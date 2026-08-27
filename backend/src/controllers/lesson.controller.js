const asyncHandler = require("../utils/asyncHandler");
const lessonService = require("../services/lesson.service");

const createLesson = asyncHandler(async (req, res) => {
  const lesson = await lessonService.createLesson(req.body);

  res.status(201).json({
    success: true,
    message: "Lesson created successfully",
    data: lesson,
  });
});

const getLessonsByModule = asyncHandler(async (req, res) => {
  const lessons = await lessonService.getLessonsByModule(req.params.moduleId);

  res.status(200).json({
    success: true,
    results: lessons.length,
    data: lessons,
  });
});

const getLesson = asyncHandler(async (req, res) => {
  const lesson = await lessonService.getLessonById(req.params.id);

  res.status(200).json({
    success: true,
    data: lesson,
  });
});

const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await lessonService.updateLesson(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: "Lesson updated successfully",
    data: lesson,
  });
});

const deleteLesson = asyncHandler(async (req, res) => {
  const result = await lessonService.deleteLesson(req.params.id);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

module.exports = {
  createLesson,
  getLessonsByModule,
  getLesson,
  updateLesson,
  deleteLesson,
};