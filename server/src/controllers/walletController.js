const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const {
  getFinanceSummary,
  getWalletSummary,
  listPendingPaymentLoadRequests,
  listWithdrawalRequests,
  requestWalletLoad,
  requestWalletWithdrawalWithProof,
  reviewPaymentLoadRequest,
  reviewWithdrawalRequest,
} = require("../services/walletService");
const { createNotification } = require("../services/notificationService");

const getMyWallet = catchAsync(async (req, res) => {
  const data = await getWalletSummary(req.user);

  res.status(200).json({
    status: "success",
    data,
  });
});

const loadMyWallet = catchAsync(async (req, res) => {
  const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];

  if (!userRoles.includes("client")) {
    throw new AppError("Only clients can load wallet funds right now", 403);
  }

  const request = await requestWalletLoad({
    userId: req.user.id,
    amount: req.body?.amount,
    paymentMethod: req.body?.paymentMethod,
    transactionId: req.body?.transactionId,
    screenshot: req.body?.screenshot,
  });

  const data = await getWalletSummary({
    ...req.user,
    _id: req.user.id,
  });

  res.status(200).json({
    status: "success",
    data: {
      ...data,
      request,
    },
  });
});

const requestMyWithdrawal = catchAsync(async (req, res) => {
  const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];

  if (!userRoles.includes("freelancer")) {
    throw new AppError("Only freelancers can request withdrawals right now", 403);
  }

  await requestWalletWithdrawalWithProof({
    userId: req.user.id,
    amount: req.body?.amount,
    qrAttachment: req.body?.qrAttachment,
  });

  const data = await getWalletSummary({
    ...req.user,
    _id: req.user.id,
  });

  res.status(200).json({
    status: "success",
    data,
  });
});

const getFinanceManagement = catchAsync(async (req, res) => {
  const [summary, pendingPayments, pendingWithdrawals] = await Promise.all([
    getFinanceSummary(),
    listPendingPaymentLoadRequests("pending"),
    listWithdrawalRequests("pending"),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      summary,
      pendingPayments,
      pendingWithdrawals,
    },
  });
});

const listPaymentVerificationQueue = catchAsync(async (req, res) => {
  const data = await listPendingPaymentLoadRequests(req.query.status || "pending");

  res.status(200).json({
    status: "success",
    results: data.length,
    data,
  });
});

const reviewPaymentVerification = catchAsync(async (req, res) => {
  const request = await reviewPaymentLoadRequest({
    requestId: req.params.id,
    adminId: req.user.id,
    decision: req.body?.decision,
    approvedAmount: req.body?.approvedAmount,
    notes: req.body?.notes,
  });

  await createNotification({
    recipient: request.user?._id || request.user,
    actor: req.user.id,
    type: "wallet.load_reviewed",
    title: "Wallet load reviewed",
    message:
      request.status === "rejected"
        ? "Your wallet load request was rejected."
        : request.status === "partial"
          ? `Your wallet load request was partially approved for NPR ${Number(request.approvedAmount || 0).toLocaleString()}.`
          : `Your wallet load request was approved for NPR ${Number(request.approvedAmount || 0).toLocaleString()}.`,
    link: "/wallet",
    metadata: {},
  });

  res.status(200).json({
    status: "success",
    data: request,
  });
});

const reviewWithdrawalRelease = catchAsync(async (req, res) => {
  const request = await reviewWithdrawalRequest({
    requestId: req.params.id,
    adminId: req.user.id,
    decision: req.body?.decision,
    notes: req.body?.notes,
  });

  await createNotification({
    recipient: request.user?._id || request.user,
    actor: req.user.id,
    type: "wallet.withdrawal_reviewed",
    title: "Withdrawal request reviewed",
    message:
      request.status === "released"
        ? `Your withdrawal request for NPR ${Number(request.requestedAmount || 0).toLocaleString()} was released.`
        : "Your withdrawal request was rejected and the funds were restored.",
    link: "/wallet",
    metadata: {},
  });

  res.status(200).json({
    status: "success",
    data: request,
  });
});

module.exports = {
  getFinanceManagement,
  getMyWallet,
  loadMyWallet,
  listPaymentVerificationQueue,
  requestMyWithdrawal,
  reviewPaymentVerification,
  reviewWithdrawalRelease,
};
