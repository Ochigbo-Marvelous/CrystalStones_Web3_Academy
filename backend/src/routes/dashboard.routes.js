const express = require("express");
const dashboardController = require("../controllers/dashboard.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

router.get("/", dashboardController.getDashboard);

module.exports = router;