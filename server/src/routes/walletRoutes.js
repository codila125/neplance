const express = require("express");
const { getMyWallet, loadMyWallet } = require("../controllers/walletController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getMyWallet);
router.post("/load", loadMyWallet);

module.exports = router;
