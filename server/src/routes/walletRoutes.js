const express = require("express");
const {
  getMyWallet,
  loadMyWallet,
  requestMyWithdrawal,
} = require("../controllers/walletController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getMyWallet);
router.post("/load", loadMyWallet);
router.post("/withdraw", requestMyWithdrawal);

module.exports = router;
