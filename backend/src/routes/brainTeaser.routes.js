const express = require("express");
const brainTeaserController = require("../controllers/brainTeaser.controller");
const validate = require("../middlewares/validate");
const {
  createBrainTeaserSchema,
  updateBrainTeaserSchema,
} = require("../validations/brainTeaser.validation");
const { protect } = require("../middlewares/auth");
const { adminOnly } = require("../middlewares/admin");

const router = express.Router();


router.get("/module/:moduleId", brainTeaserController.getBrainTeasersByModule);
router.get("/:id", brainTeaserController.getBrainTeaser);


router.post("/", protect, adminOnly, validate(createBrainTeaserSchema), brainTeaserController.createBrainTeaser);
router.patch("/:id", protect, adminOnly, validate(updateBrainTeaserSchema), brainTeaserController.updateBrainTeaser);
router.delete("/:id", protect, adminOnly, brainTeaserController.deleteBrainTeaser);

module.exports = router;