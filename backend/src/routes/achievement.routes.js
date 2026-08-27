const express = require("express");
const achievementController = require("../controllers/achievement.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

router.get("/me", achievementController.getMyAchievements);
router.get("/", achievementController.getAllAchievements);

module.exports = router;