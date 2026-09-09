
const express = require("express");
const certificateController = require("../controllers/certificate.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.get("/verify/:code", certificateController.verifyPublic);
router.use(protect);
router.get("/", certificateController.listMine);
router.get("/:track", certificateController.getMine);

module.exports = router;