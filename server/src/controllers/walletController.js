const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const {
  getWalletSummary,
  loadWalletFunds,
} = require("../services/walletService");

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

  const wallet = await loadWalletFunds({
    userId: req.user.id,
    amount: req.body?.amount,
  });

  const data = await getWalletSummary({
    ...req.user,
    _id: req.user.id,
  });

  res.status(200).json({
    status: "success",
    data: {
      ...data,
      wallet,
    },
  });
});

module.exports = {
  getMyWallet,
  loadMyWallet,
};
