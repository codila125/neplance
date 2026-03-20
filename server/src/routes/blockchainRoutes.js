const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { listChainBlocks } = require("../blockchain/controllers/chainController");

const router = express.Router();

router.use(protect);
router.get("/chain", listChainBlocks);

module.exports = router;
