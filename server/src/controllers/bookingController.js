const Booking = require("../models/Booking");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const {
  createBookingFromProposal,
  generateBookingVisitOtp,
  submitBookingQuote,
  verifyBookingVisitOtp,
} = require("../services/bookingService");
const { createNotification } = require("../services/notificationService");
const Proposal = require("../models/Proposal");

const populateBooking = (query) =>
  query
    .populate("client", "name email avatar")
    .populate(
      "freelancer",
      "name email avatar bio experienceLevel availabilityStatus skills verificationStatus",
    )
    .populate(
      "job",
      "title description category subcategory budget budgetType jobType location physicalDetails deadline attachments status creatorAddress selectedProposal activeBooking activeContract hiredFreelancer",
    )
    .populate(
      "proposal",
      "amount pricingType deliveryDays status coverLetter inspectionNotes visitAvailableOn attachments",
    )
    .populate("contract", "title status totalAmount contractType");

const getBookingById = catchAsync(async (req, res) => {
  const booking = await populateBooking(
    Booking.findOne({
      _id: req.params.id,
      $or: [{ client: req.user.id }, { freelancer: req.user.id }],
    }),
  );

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  res.status(200).json({
    status: "success",
    data: booking,
  });
});

const getBookingByProposal = catchAsync(async (req, res) => {
  const proposal = await Proposal.findById(req.params.proposalId);
  if (!proposal) {
    throw new AppError("Proposal not found", 404);
  }

  const booking = await populateBooking(
    Booking.findOne({
      proposal: req.params.proposalId,
      $or: [{ client: req.user.id }, { freelancer: req.user.id }],
    }),
  );

  res.status(200).json({
    status: "success",
    data: booking,
  });
});

const createBooking = catchAsync(async (req, res) => {
  const proposal = await Proposal.findById(req.params.proposalId);
  if (!proposal) {
    throw new AppError("Proposal not found", 404);
  }

  const booking = await createBookingFromProposal({
    clientId: req.user.id,
    proposal,
    notes: req.body?.notes,
    scheduledFor: req.body?.scheduledFor,
  });

  const populatedBooking = await populateBooking(Booking.findById(booking._id));

  await createNotification({
    recipient: booking.freelancer,
    actor: req.user.id,
    type: "booking.created",
    title: "Physical booking created",
    message: `You were selected for a physical inspection booking for "${populatedBooking.job?.title || "a job"}".`,
    link: `/bookings/${booking._id}`,
    metadata: {
      job: booking.job,
      proposal: booking.proposal,
      booking: booking._id,
    },
  });

  res.status(201).json({
    status: "success",
    data: populatedBooking,
  });
});

const generateMyBookingVisitOtp = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  const updatedBooking = await generateBookingVisitOtp({
    booking,
    clientId: req.user.id,
  });
  const populatedBooking = await populateBooking(
    Booking.findById(updatedBooking._id),
  );

  await createNotification({
    recipient: updatedBooking.freelancer,
    actor: req.user.id,
    type: "booking.visit_otp_generated",
    title: "Visit OTP generated",
    message: `An on-site OTP is ready for "${populatedBooking.job?.title || "your booking"}".`,
    link: `/bookings/${updatedBooking._id}`,
    metadata: {
      job: updatedBooking.job,
      proposal: updatedBooking.proposal,
      booking: updatedBooking._id,
    },
  });

  res.status(200).json({
    status: "success",
    data: populatedBooking,
  });
});

const verifyMyBookingVisitOtp = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  const updatedBooking = await verifyBookingVisitOtp({
    booking,
    freelancerId: req.user.id,
    otpCode: req.body?.otpCode,
  });
  const populatedBooking = await populateBooking(
    Booking.findById(updatedBooking._id),
  );

  await createNotification({
    recipient: updatedBooking.client,
    actor: req.user.id,
    type: "booking.visit_verified",
    title: "Physical visit verified",
    message: `The freelancer verified the on-site visit for "${populatedBooking.job?.title || "your booking"}".`,
    link: `/bookings/${updatedBooking._id}`,
    metadata: {
      job: updatedBooking.job,
      proposal: updatedBooking.proposal,
      booking: updatedBooking._id,
    },
  });

  res.status(200).json({
    status: "success",
    data: populatedBooking,
  });
});

const submitMyBookingQuote = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  const updatedBooking = await submitBookingQuote({
    booking,
    freelancerId: req.user.id,
    quoteAmount: req.body?.quoteAmount,
    quoteNotes: req.body?.quoteNotes,
    quoteAttachments: req.body?.quoteAttachments,
  });
  const populatedBooking = await populateBooking(
    Booking.findById(updatedBooking._id),
  );

  await createNotification({
    recipient: updatedBooking.client,
    actor: req.user.id,
    type: "booking.quoted",
    title: "Inspection quote submitted",
    message: `A final quote is ready for "${populatedBooking.job?.title || "your booking"}".`,
    link: `/bookings/${updatedBooking._id}`,
    metadata: {
      job: updatedBooking.job,
      proposal: updatedBooking.proposal,
      booking: updatedBooking._id,
    },
  });

  res.status(200).json({
    status: "success",
    data: populatedBooking,
  });
});

module.exports = {
  createBooking,
  generateMyBookingVisitOtp,
  getBookingById,
  getBookingByProposal,
  submitMyBookingQuote,
  verifyMyBookingVisitOtp,
};
