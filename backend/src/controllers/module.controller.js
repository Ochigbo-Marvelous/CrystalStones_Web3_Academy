const asyncHandler = require("../utils/asyncHandler");
const moduleService = require("../services/module.service");

const createModule = asyncHandler(async (req, res) => {
  const module = await moduleService.createModule(req.body);

  res.status(201).json({
    success: true,
    message: "Module created successfully",
    data: module,
  });
});

const getModulesByCourse = asyncHandler(async (req, res) => {
  const modules = await moduleService.getModulesByCourse(req.params.courseId);

  res.status(200).json({
    success: true,
    results: modules.length,
    data: modules,
  });
});

const getModule = asyncHandler(async (req, res) => {
  const module = await moduleService.getModuleById(req.params.id);

  res.status(200).json({
    success: true,
    data: module,
  });
});

const updateModule = asyncHandler(async (req, res) => {
  const module = await moduleService.updateModule(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: "Module updated successfully",
    data: module,
  });
});

const deleteModule = asyncHandler(async (req, res) => {
  const result = await moduleService.deleteModule(req.params.id);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

module.exports = {
  createModule,
  getModulesByCourse,
  getModule,
  updateModule,
  deleteModule,
};