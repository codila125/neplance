const Booking = require("../models/Booking");
const Job = require("../models/Job");
const Proposal = require("../models/Proposal");
const AppError = require("../utils/appError");
const {
  BOOKING_STATUS,
  JOB_STATUS,
  PROPOSAL_STATUS,
} = require("../constants/statuses");

const normalizeAttachments = (attachments = []) =>
  Array.isArray(attachments)
    ? attachments
        .filter((attachment) => attachment?.url)
        .map((attachment) => ({
          name: attachment.name || "",
          url: attachment.url,
          publicId: attachment.publicId || "",
          resourceType: attachment.resourceType || "raw",
          uploadedAt: attachment.uploadedAt || new Date(),
        }))
    : [];

const createVisitOtpCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const ensurePhysicalProposal = (job, proposal) => {
  if (!job || !proposal) {
    throw new AppError("Booking context is invalid", 400);
  }

  if (job.jobType !== "physical") {
    throw new AppError("Bookings are only available for physical jobs", 400);
  }
};

const ensureClientOwnsJob = (job, clientId) => {
  if (String(job.creatorAddress) !== String(clientId)) {
    throw new AppError("Only the client who posted the job can create a booking", 403);
  }
};

const ensureFreelancerOwnsBooking = (booking, freelancerId) => {
  if (String(booking.freelancer) !== String(freelancerId)) {
    throw new AppError("Only the selected freelancer can update this booking", 403);
  }
};

const ensureClientOwnsBooking = (booking, clientId) => {
  if (String(booking.client) !== String(clientId)) {
    throw new AppError("Only the booking client can perform this action", 403);
  }
};

const createBookingFromProposal = async ({
  clientId,
  proposal,
  notes,
  scheduledFor,
}) => {
  const job = await Job.findById(proposal.job);
  if (!job) {
    throw new AppError("Job not found", 404);
  }

  ensurePhysicalProposal(job, proposal);
  ensureClientOwnsJob(job, clientId);

  if (![PROPOSAL_STATUS.PENDING, PROPOSAL_STATUS.ACCEPTED].includes(proposal.status)) {
    throw new AppError("Only active proposals can be converted into a booking", 400);
  }

  if (job.activeContract) {
    throw new AppError("This job already has a contract", 400);
  }

  const existingBooking = await Booking.findOne({ proposal: proposal._id });
  if (existingBooking && existingBooking.status !== BOOKING_STATUS.CANCELLED) {
    return existingBooking;
  }

  if (
    job.activeBooking &&
    String(job.activeBooking) !== String(existingBooking?._id || "")
  ) {
    throw new AppError("This job already has an active booking", 400);
  }

  const requiresVisit = Boolean(
    proposal.pricingType === "inspection_required" ||
      job.budgetType === "inspection_required" ||
      job.physicalDetails?.siteVisitRequired,
  );

  const booking = await Booking.create({
    job: job._id,
    proposal: proposal._id,
    client: clientId,
    freelancer: proposal.freelancer,
    status: BOOKING_STATUS.PENDING,
    requiresVisit,
    scheduledFor: scheduledFor || job.physicalDetails?.preferredVisitDate || undefined,
    notes: typeof notes === "string" ? notes.trim() : "",
    visitVerification: {
      status: requiresVisit ? "PENDING" : "NOT_REQUIRED",
    },
  });

  job.status = JOB_STATUS.BOOKING_PENDING;
  job.hiredFreelancer = proposal.freelancer;
  job.selectedProposal = proposal._id;
  job.activeBooking = booking._id;
  job.updatedAt = new Date();
  await job.save();

  return booking;
};

const generateBookingVisitOtp = async ({ booking, clientId }) => {
  ensureClientOwnsBooking(booking, clientId);

  if (!booking.requiresVisit) {
    throw new AppError("This booking does not require a visit", 400);
  }

  if (booking.contract) {
    throw new AppError("This booking has already moved to contract creation", 400);
  }

  if (booking.visitVerification?.status === "VERIFIED") {
    throw new AppError("This booking visit has already been verified", 400);
  }

  booking.visitVerification = {
    ...(booking.visitVerification || {}),
    status: "PENDING",
    otpCode: createVisitOtpCode(),
    generatedAt: new Date(),
    generatedBy: clientId,
    verifiedAt: undefined,
    verifiedBy: undefined,
  };
  booking.status = BOOKING_STATUS.VISIT_OTP_PENDING;
  booking.updatedAt = new Date();
  await booking.save();

  return booking;
};

const verifyBookingVisitOtp = async ({ booking, freelancerId, otpCode }) => {
  ensureFreelancerOwnsBooking(booking, freelancerId);

  if (!booking.requiresVisit) {
    throw new AppError("This booking does not require visit verification", 400);
  }

  if (booking.contract) {
    throw new AppError("This booking has already moved to contract creation", 400);
  }

  const expectedCode = String(booking.visitVerification?.otpCode || "");
  if (!expectedCode) {
    throw new AppError("The client has not generated an OTP yet", 400);
  }

  if (String(otpCode || "").trim() !== expectedCode) {
    throw new AppError("Invalid OTP code", 400);
  }

  booking.visitVerification = {
    ...(booking.visitVerification || {}),
    status: "VERIFIED",
    otpCode: undefined,
    verifiedAt: new Date(),
    verifiedBy: freelancerId,
  };
  booking.status =
    Number(booking.quoteAmount || 0) > 0
      ? BOOKING_STATUS.QUOTED
      : BOOKING_STATUS.VISIT_VERIFIED;
  booking.updatedAt = new Date();
  await booking.save();

  return booking;
};

const submitBookingQuote = async ({
  booking,
  freelancerId,
  quoteAmount,
  quoteNotes,
  quoteAttachments,
}) => {
  ensureFreelancerOwnsBooking(booking, freelancerId);

  if (booking.contract) {
    throw new AppError("A contract has already been created for this booking", 400);
  }

  if (
    booking.requiresVisit &&
    booking.visitVerification?.status !== "VERIFIED"
  ) {
    throw new AppError(
      "Complete the on-site OTP verification before submitting a quote",
      400,
    );
  }

  const normalizedAmount = Number(quoteAmount || 0);
  if (normalizedAmount <= 0) {
    throw new AppError("Quote amount must be greater than zero", 400);
  }

  booking.quoteAmount = normalizedAmount;
  booking.quoteNotes =
    typeof quoteNotes === "string" ? quoteNotes.trim() : "";
  booking.quoteAttachments = normalizeAttachments(quoteAttachments);
  booking.quotedAt = new Date();
  booking.status = BOOKING_STATUS.QUOTED;
  booking.updatedAt = new Date();
  await booking.save();

  return booking;
};

module.exports = {
  createBookingFromProposal,
  generateBookingVisitOtp,
  submitBookingQuote,
  verifyBookingVisitOtp,
};
