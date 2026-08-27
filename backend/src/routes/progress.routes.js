const express = require("express");
const progressController = require("../controllers/progress.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

router.post("/quiz/:moduleId", progressController.submitQuiz);
router.get("/module/:moduleId", progressController.getModuleProgress);

module.exports = router;