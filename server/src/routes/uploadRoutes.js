const express = require("express");

const { protect } = require("../middlewares/authMiddleware");
const { createUploadSignature } = require("../controllers/uploadController");

const router = express.Router();

router.post("/sign", protect, createUploadSignature);

module.exports = router;
