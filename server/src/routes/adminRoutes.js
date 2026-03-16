const express = require("express");

const router = express.Router();

const { adminFindJobs } = require("../controllers/jobController");

// Public admin endpoints for development/testing (no auth)
router.get("/jobs", adminFindJobs);

module.exports = router;
