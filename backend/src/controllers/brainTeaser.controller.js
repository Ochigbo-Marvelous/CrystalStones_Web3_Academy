const asyncHandler = require("../utils/asyncHandler");
const brainTeaserService = require("../services/brainTeaser.service");

const createBrainTeaser = asyncHandler(async (req, res) => {
  const teaser = await brainTeaserService.createBrainTeaser(req.body);

  res.status(201).json({
    success: true,
    message: "Brain teaser created successfully",
    data: teaser,
  });
});

const getBrainTeasersByModule = asyncHandler(async (req, res) => {
  // Public version – does NOT return the correct answer
  const teasers = await brainTeaserService.getBrainTeasersByModule(req.params.moduleId);

  res.status(200).json({
    success: true,
    results: teasers.length,
    data: teasers,
  });
});

const getBrainTeaser = asyncHandler(async (req, res) => {
  const teaser = await brainTeaserService.getBrainTeaserById(req.params.id);

  // Remove correct answer for security if needed
  res.status(200).json({
    success: true,
    data: teaser,
  });
});

const updateBrainTeaser = asyncHandler(async (req, res) => {
  const teaser = await brainTeaserService.updateBrainTeaser(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: "Brain teaser updated successfully",
    data: teaser,
  });
});

const deleteBrainTeaser = asyncHandler(async (req, res) => {
  const result = await brainTeaserService.deleteBrainTeaser(req.params.id);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

module.exports = {
  createBrainTeaser,
  getBrainTeasersByModule,
  getBrainTeaser,
  updateBrainTeaser,
  deleteBrainTeaser,
};