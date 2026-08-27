const express = require("express");
const mentorController = require("../controllers/mentor.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

router.post("/ask", mentorController.askMentor);

module.exports = router;