const express = require("express");
const profileController = require("../controllers/profile.controller");
const validate = require("../middlewares/validate");
const {
  updateProfileSchema,
  changePasswordSchema,
} = require("../validations/profile.validation");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

router.patch("/", validate(updateProfileSchema), profileController.updateProfile);
router.patch("/change-password", validate(changePasswordSchema), profileController.changePassword);
router.get("/certificates", profileController.getCertificates);

module.exports = router;