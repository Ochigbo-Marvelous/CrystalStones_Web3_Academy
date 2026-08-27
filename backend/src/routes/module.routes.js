const express = require("express");
const moduleController = require("../controllers/module.controller");
const validate = require("../middlewares/validate");
const { createModuleSchema, updateModuleSchema } = require("../validations/module.validation");
const { protect } = require("../middlewares/auth");
const { adminOnly } = require("../middlewares/admin");

const router = express.Router();

router.get("/course/:courseId", moduleController.getModulesByCourse);
router.get("/:id", moduleController.getModule);


router.post("/", protect, adminOnly, validate(createModuleSchema), moduleController.createModule);
router.patch("/:id", protect, adminOnly, validate(updateModuleSchema), moduleController.updateModule);
router.delete("/:id", protect, adminOnly, moduleController.deleteModule);

module.exports = router;