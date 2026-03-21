const express = require("express");
const {
  createBooking,
  generateMyBookingVisitOtp,
  getBookingById,
  getBookingByProposal,
  submitMyBookingQuote,
  verifyMyBookingVisitOtp,
} = require("../controllers/bookingController");
const {
  protect,
  requireVerifiedUser,
  restrictTo,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/proposal/:proposalId", getBookingByProposal);
router.post(
  "/proposal/:proposalId",
  restrictTo("client"),
  requireVerifiedUser,
  createBooking,
);
router.get("/:id", getBookingById);
router.patch("/:id/visit-otp", restrictTo("client"), generateMyBookingVisitOtp);
router.patch(
  "/:id/visit-otp/verify",
  restrictTo("freelancer"),
  verifyMyBookingVisitOtp,
);
router.patch(
  "/:id/quote",
  restrictTo("freelancer"),
  requireVerifiedUser,
  submitMyBookingQuote,
);

module.exports = router;
