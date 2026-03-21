const Contract = require("../models/Contract");
const PaymentLoadRequest = require("../models/PaymentLoadRequest");
const WithdrawalRequest = require("../models/WithdrawalRequest");
const Wallet = require("../models/Wallet");
const AppError = require("../utils/appError");
const { createAdminNotifications } = require("./notificationService");
const {
  CONTRACT_FUNDING_STATUS,
  CONTRACT_STATUS,
} = require("../constants/statuses");

const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });

  if (!wallet) {
    wallet = await Wallet.create({
      user: userId,
    });
  }

  return wallet;
};

const pushTransaction = (wallet, transaction) => {
  wallet.transactions.unshift({
    type: transaction.type,
    amount: Number(transaction.amount) || 0,
    direction: transaction.direction,
    description: transaction.description || transaction.type,
    status: transaction.status || "completed",
    contract: transaction.contract || undefined,
    createdAt: transaction.createdAt || new Date(),
  });
};

const creditWalletLoad = async ({
  wallet,
  amount,
  description,
  status = "completed",
}) => {
  const normalizedAmount = Number(amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new AppError("Wallet load amount must be greater than zero", 400);
  }

  wallet.balance += normalizedAmount;
  wallet.totalLoaded += normalizedAmount;
  pushTransaction(wallet, {
    type: "wallet_load",
    amount: normalizedAmount,
    direction: "credit",
    description,
    status,
  });
  wallet.updatedAt = new Date();
  await wallet.save();

  return wallet;
};

const requestWalletLoad = async ({
  userId,
  amount,
  paymentMethod,
  transactionId,
  screenshot,
}) => {
  const normalizedAmount = Number(amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new AppError("Wallet load amount must be greater than zero", 400);
  }

  if (!["esewa", "khalti", "bank"].includes(paymentMethod)) {
    throw new AppError("Please choose a valid payment method", 400);
  }

  if (!String(transactionId || "").trim()) {
    throw new AppError("Transaction ID is required", 400);
  }

  if (!screenshot?.url) {
    throw new AppError("Please upload your payment screenshot", 400);
  }

  const wallet = await getOrCreateWallet(userId);
  const request = await PaymentLoadRequest.create({
    user: userId,
    wallet: wallet._id,
    requestedAmount: normalizedAmount,
    paymentMethod,
    transactionId: String(transactionId).trim(),
    screenshot,
    status: "pending",
    updatedAt: new Date(),
  });

  pushTransaction(wallet, {
    type: "wallet_load_request",
    amount: normalizedAmount,
    direction: "credit",
    description: `Wallet load request via ${paymentMethod}`,
    status: "pending",
    createdAt: request.createdAt,
  });
  wallet.updatedAt = new Date();
  await wallet.save();

  await createAdminNotifications({
    actor: userId,
    type: "admin.payment_load_requested",
    title: "Wallet load pending verification",
    message: `A user requested NPR ${normalizedAmount.toLocaleString()} wallet load via ${paymentMethod}.`,
    link: "/admin/pending-payments",
    metadata: {},
  });

  return request;
};

const listPendingPaymentLoadRequests = async (status = "pending") => {
  const query = status === "all" ? {} : { status };

  return PaymentLoadRequest.find(query)
    .populate("user", "name email avatar role")
    .populate("reviewedBy", "name email avatar role")
    .sort({ createdAt: -1 });
};

const reviewPaymentLoadRequest = async ({
  requestId,
  adminId,
  decision,
  approvedAmount,
  notes,
}) => {
  const request = await PaymentLoadRequest.findById(requestId);

  if (!request) {
    throw new AppError("Payment request not found", 404);
  }

  if (request.status !== "pending") {
    throw new AppError("This payment request has already been reviewed", 400);
  }

  if (!["approve", "reject", "partial"].includes(decision)) {
    throw new AppError("Decision must be approve, reject, or partial", 400);
  }

  const wallet = await getOrCreateWallet(request.user);
  const normalizedApprovedAmount =
    decision === "reject"
      ? 0
      : Number(approvedAmount ?? request.requestedAmount);

  if (decision !== "reject") {
    if (
      !Number.isFinite(normalizedApprovedAmount) ||
      normalizedApprovedAmount <= 0
    ) {
      throw new AppError("Approved amount must be greater than zero", 400);
    }

    if (normalizedApprovedAmount > Number(request.requestedAmount || 0)) {
      throw new AppError("Approved amount cannot exceed the requested amount", 400);
    }

    await creditWalletLoad({
      wallet,
      amount: normalizedApprovedAmount,
      description:
        decision === "partial"
          ? "Partially approved wallet load"
          : "Approved wallet load",
    });
  }

  request.status =
    decision === "approve"
      ? "approved"
      : decision === "partial"
        ? "partial"
        : "rejected";
  request.approvedAmount =
    decision === "reject" ? 0 : normalizedApprovedAmount;
  request.reviewedBy = adminId;
  request.reviewedAt = new Date();
  request.reviewNotes = String(notes || "").trim();
  request.updatedAt = new Date();
  await request.save();

  return request.populate("user", "name email avatar role");
};

const requestWalletWithdrawalWithProof = async ({
  userId,
  amount,
  qrAttachment,
}) => {
  const normalizedAmount = Number(amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new AppError("Withdrawal amount must be greater than zero", 400);
  }

  if (!qrAttachment?.url) {
    throw new AppError("Please upload your QR image", 400);
  }

  const wallet = await getOrCreateWallet(userId);

  if (Number(wallet.balance || 0) < normalizedAmount) {
    throw new AppError("You do not have enough available balance to withdraw", 400);
  }

  const completedContracts = await Contract.find({
    freelancer: userId,
    status: CONTRACT_STATUS.COMPLETED,
  })
    .populate("client", "name")
    .populate("freelancer", "name")
    .sort({ completedAt: -1 })
    .limit(5);

  wallet.balance -= normalizedAmount;
  wallet.pendingWithdrawalBalance =
    Number(wallet.pendingWithdrawalBalance || 0) + normalizedAmount;
  pushTransaction(wallet, {
    type: "wallet_withdraw_request",
    amount: normalizedAmount,
    direction: "debit",
    description: "Withdrawal request submitted",
    status: "pending",
  });
  wallet.updatedAt = new Date();
  await wallet.save();

  const request = await WithdrawalRequest.create({
    user: userId,
    wallet: wallet._id,
    requestedAmount: normalizedAmount,
    qrAttachment,
    contractSnapshots: completedContracts.map((contract) => ({
      contract: contract._id,
      title: contract.title,
      amount: Number(contract.totalAmount || contract.releasedAmount || 0),
      clientName: contract.client?.name || "Client",
      freelancerName: contract.freelancer?.name || "Freelancer",
      completedAt: contract.completedAt,
    })),
    updatedAt: new Date(),
  });

  await createAdminNotifications({
    actor: userId,
    type: "admin.withdrawal_requested",
    title: "Withdrawal request pending release",
    message: `A freelancer requested NPR ${normalizedAmount.toLocaleString()} withdrawal release.`,
    link: "/admin/finance",
    metadata: {},
  });

  return request;
};

const listWithdrawalRequests = async (status = "pending") => {
  const query = status === "all" ? {} : { status };

  return WithdrawalRequest.find(query)
    .populate("user", "name email avatar role")
    .populate("reviewedBy", "name email avatar role")
    .sort({ createdAt: -1 });
};

const reviewWithdrawalRequest = async ({
  requestId,
  adminId,
  decision,
  notes,
}) => {
  if (!["release", "reject"].includes(decision)) {
    throw new AppError("Decision must be release or reject", 400);
  }

  const request = await WithdrawalRequest.findById(requestId);
  if (!request) {
    throw new AppError("Withdrawal request not found", 404);
  }

  if (request.status !== "pending") {
    throw new AppError("This withdrawal request has already been reviewed", 400);
  }

  const wallet = await getOrCreateWallet(request.user);
  const amount = Number(request.requestedAmount || 0);

  if (decision === "release") {
    if (Number(wallet.pendingWithdrawalBalance || 0) < amount) {
      throw new AppError("Wallet pending withdrawal balance is insufficient", 400);
    }

    wallet.pendingWithdrawalBalance -= amount;
    pushTransaction(wallet, {
      type: "wallet_withdraw_release",
      amount,
      direction: "debit",
      description: "Withdrawal released by admin",
      status: "completed",
    });
    request.status = "released";
  } else {
    wallet.pendingWithdrawalBalance -= amount;
    wallet.balance += amount;
    pushTransaction(wallet, {
      type: "wallet_withdraw_rejected",
      amount,
      direction: "credit",
      description: "Withdrawal request rejected and funds restored",
      status: "completed",
    });
    request.status = "rejected";
  }

  wallet.updatedAt = new Date();
  await wallet.save();

  request.reviewedBy = adminId;
  request.reviewedAt = new Date();
  request.reviewNotes = String(notes || "").trim();
  request.updatedAt = new Date();
  await request.save();

  return request.populate("user", "name email avatar role");
};

const getFinanceSummary = async () => {
  const [wallets, pendingTopups, pendingWithdrawals] = await Promise.all([
    Wallet.find({}).select(
      "balance heldBalance pendingWithdrawalBalance totalLoaded totalSpent totalEarned"
    ),
    PaymentLoadRequest.countDocuments({ status: "pending" }),
    WithdrawalRequest.countDocuments({ status: "pending" }),
  ]);

  return wallets.reduce(
    (summary, wallet) => {
      summary.platformBalance += Number(wallet.balance || 0);
      summary.heldBalance += Number(wallet.heldBalance || 0);
      summary.pendingWithdrawalBalance += Number(
        wallet.pendingWithdrawalBalance || 0,
      );
      summary.totalLoaded += Number(wallet.totalLoaded || 0);
      summary.totalSpent += Number(wallet.totalSpent || 0);
      summary.totalEarned += Number(wallet.totalEarned || 0);
      summary.pendingTopups = pendingTopups;
      summary.pendingWithdrawals = pendingWithdrawals;
      return summary;
    },
    {
      platformBalance: 0,
      heldBalance: 0,
      pendingWithdrawalBalance: 0,
      totalLoaded: 0,
      totalSpent: 0,
      totalEarned: 0,
      pendingTopups,
      pendingWithdrawals,
    },
  );
};

const updateFundingStatus = (contract) => {
  const funded = Number(contract.fundedAmount || 0);
  const released = Number(contract.releasedAmount || 0);
  const refunded = Number(contract.refundedAmount || 0);

  if (!funded) {
    contract.fundingStatus = CONTRACT_FUNDING_STATUS.UNFUNDED;
    return contract.fundingStatus;
  }

  if (refunded >= funded && funded > 0) {
    contract.fundingStatus = CONTRACT_FUNDING_STATUS.REFUNDED;
    return contract.fundingStatus;
  }

  if (released >= funded && funded > 0) {
    contract.fundingStatus = CONTRACT_FUNDING_STATUS.RELEASED;
    return contract.fundingStatus;
  }

  if (released > 0) {
    contract.fundingStatus = CONTRACT_FUNDING_STATUS.PARTIALLY_RELEASED;
    return contract.fundingStatus;
  }

  if (refunded > 0) {
    contract.fundingStatus = CONTRACT_FUNDING_STATUS.PARTIALLY_REFUNDED;
    return contract.fundingStatus;
  }

  contract.fundingStatus = CONTRACT_FUNDING_STATUS.FUNDED;
  return contract.fundingStatus;
};

const linkLatestFundingTransactionToContract = async ({
  clientId,
  contractId,
  contractTitle,
  amount,
}) => {
  const wallet = await getOrCreateWallet(clientId);
  const normalizedAmount = Number(amount) || 0;
  const now = Date.now();

  const transaction = wallet.transactions.find((item) => {
    if (item?.contract) {
      return false;
    }

    if (![
      "contract_funded",
      "contract_funding_adjustment",
      "contract_funding_cancelled",
    ].includes(item?.type)) {
      return false;
    }

    const amountMatches = Number(item?.amount || 0) === normalizedAmount;
    const descriptionMatches = String(item?.description || "").includes(
      contractTitle,
    );
    const createdAt = new Date(item?.createdAt || 0).getTime();
    const isRecent = Number.isFinite(createdAt) && now - createdAt < 15 * 60 * 1000;

    return amountMatches && descriptionMatches && isRecent;
  });

  if (!transaction) {
    return;
  }

  transaction.contract = contractId;
  wallet.updatedAt = new Date();
  await wallet.save();
};

const reserveContractFunds = async ({ clientId, contractTitle, amount }) => {
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new AppError("Contract funding amount must be greater than zero", 400);
  }

  const wallet = await getOrCreateWallet(clientId);
  if (wallet.balance < normalizedAmount) {
    throw new AppError(
      `Insufficient wallet balance. Please load at least NPR ${(normalizedAmount - wallet.balance).toLocaleString()}.`,
      400
    );
  }

  wallet.balance -= normalizedAmount;
  wallet.heldBalance += normalizedAmount;
  pushTransaction(wallet, {
    type: "contract_funded",
    amount: normalizedAmount,
    direction: "debit",
    description: `Reserved funds for contract "${contractTitle}"`,
  });
  wallet.updatedAt = new Date();
  await wallet.save();

  return wallet;
};

const syncPendingContractFunding = async ({
  clientId,
  contract,
  nextFundedAmount,
  description,
}) => {
  const normalizedNextAmount = Number(nextFundedAmount);

  if (!Number.isFinite(normalizedNextAmount) || normalizedNextAmount < 0) {
    throw new AppError("Contract funding amount must be zero or greater", 400);
  }

  const wallet = await getOrCreateWallet(clientId);
  const currentFundedAmount = Number(contract.fundedAmount || 0);
  const difference = normalizedNextAmount - currentFundedAmount;

  if (difference > 0) {
    if (wallet.balance < difference) {
      throw new AppError(
        `Insufficient wallet balance. Please load at least NPR ${(difference - wallet.balance).toLocaleString()}.`,
        400
      );
    }

    wallet.balance -= difference;
    wallet.heldBalance += difference;
    pushTransaction(wallet, {
      type: "contract_funding_adjustment",
      amount: difference,
      direction: "debit",
      description,
      contract: contract._id,
    });
  } else if (difference < 0) {
    const refundAmount = Math.abs(difference);

    if (wallet.heldBalance < refundAmount) {
      throw new AppError("Client wallet does not have enough held funds", 400);
    }

    wallet.heldBalance -= refundAmount;
    wallet.balance += refundAmount;
    pushTransaction(wallet, {
      type: "contract_funding_adjustment",
      amount: refundAmount,
      direction: "credit",
      description,
      contract: contract._id,
    });
  }

  wallet.updatedAt = new Date();
  await wallet.save();

  contract.fundedAmount = normalizedNextAmount;
  if (normalizedNextAmount > 0 && !contract.fundedAt) {
    contract.fundedAt = new Date();
  }
  updateFundingStatus(contract);

  return wallet;
};

const releasePendingContractFunding = async ({
  clientId,
  contract,
  description,
}) => {
  const wallet = await getOrCreateWallet(clientId);
  const fundedAmount = Number(contract.fundedAmount || 0);

  if (fundedAmount <= 0) {
    return wallet;
  }

  if (wallet.heldBalance < fundedAmount) {
    throw new AppError("Client wallet does not have enough held funds", 400);
  }

  wallet.heldBalance -= fundedAmount;
  wallet.balance += fundedAmount;
  pushTransaction(wallet, {
    type: "contract_funding_cancelled",
    amount: fundedAmount,
    direction: "credit",
    description,
    contract: contract._id,
  });
  wallet.updatedAt = new Date();
  await wallet.save();

  contract.fundedAmount = 0;
  contract.fundingStatus = CONTRACT_FUNDING_STATUS.UNFUNDED;

  return wallet;
};

const releaseContractFunds = async ({
  contract,
  amount,
  description,
}) => {
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new AppError("Release amount must be greater than zero", 400);
  }

  const remainingHeld =
    Number(contract.fundedAmount || 0) -
    Number(contract.releasedAmount || 0) -
    Number(contract.refundedAmount || 0);

  if (normalizedAmount > remainingHeld) {
    throw new AppError("Release amount exceeds the remaining funded balance", 400);
  }

  const [clientWallet, freelancerWallet] = await Promise.all([
    getOrCreateWallet(contract.client),
    getOrCreateWallet(contract.freelancer),
  ]);

  const heldBalance = Number(clientWallet.heldBalance || 0);
  const availableBalance = Number(clientWallet.balance || 0);
  const totalSpendable = heldBalance + availableBalance;

  if (totalSpendable < normalizedAmount) {
    throw new AppError("Client wallet does not have enough funds", 400);
  }

  const fromHeld = Math.min(heldBalance, normalizedAmount);
  const fromAvailable = normalizedAmount - fromHeld;

  clientWallet.heldBalance = heldBalance - fromHeld;
  if (fromAvailable > 0) {
    clientWallet.balance = availableBalance - fromAvailable;
  }
  clientWallet.totalSpent += normalizedAmount;
    pushTransaction(clientWallet, {
      type: "contract_release",
      amount: normalizedAmount,
      direction: "debit",
      description,
      contract: contract._id,
    });

  freelancerWallet.balance += normalizedAmount;
  freelancerWallet.totalEarned += normalizedAmount;
  pushTransaction(freelancerWallet, {
    type: "contract_release",
    amount: normalizedAmount,
    direction: "credit",
    description,
    contract: contract._id,
  });

  clientWallet.updatedAt = new Date();
  freelancerWallet.updatedAt = new Date();
  await Promise.all([clientWallet.save(), freelancerWallet.save()]);

  contract.releasedAmount = Number(contract.releasedAmount || 0) + normalizedAmount;
  updateFundingStatus(contract);
  return contract;
};

const refundContractFunds = async ({
  contract,
  amount,
  description,
}) => {
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new AppError("Refund amount must be greater than zero", 400);
  }

  const remainingHeld =
    Number(contract.fundedAmount || 0) -
    Number(contract.releasedAmount || 0) -
    Number(contract.refundedAmount || 0);

  if (normalizedAmount > remainingHeld) {
    throw new AppError("Refund amount exceeds the remaining funded balance", 400);
  }

  const clientWallet = await getOrCreateWallet(contract.client);
  if (clientWallet.heldBalance < normalizedAmount) {
    throw new AppError("Client wallet does not have enough held funds", 400);
  }

  clientWallet.heldBalance -= normalizedAmount;
  clientWallet.balance += normalizedAmount;
  pushTransaction(clientWallet, {
    type: "contract_refund",
    amount: normalizedAmount,
    direction: "credit",
    description,
    contract: contract._id,
  });
  clientWallet.updatedAt = new Date();
  await clientWallet.save();

  contract.refundedAmount = Number(contract.refundedAmount || 0) + normalizedAmount;
  updateFundingStatus(contract);
  return contract;
};

const getWalletSummary = async (user) => {
  const wallet = await getOrCreateWallet(user._id);
  const roles = Array.isArray(user.role) ? user.role : [user.role];

  const [completedContracts, activeContracts, pendingLoadRequests] =
    await Promise.all([
    Contract.find({
      $or: [{ client: user._id }, { freelancer: user._id }],
      status: CONTRACT_STATUS.COMPLETED,
    }).select(
      "title totalAmount releasedAmount refundedAmount fundedAmount currency completedAt createdAt"
    ),
    Contract.find({
      $or: [{ client: user._id }, { freelancer: user._id }],
      status: {
        $in: [
          CONTRACT_STATUS.PENDING_FREELANCER_SIGNATURE,
          CONTRACT_STATUS.ACTIVE,
        ],
      },
    }).select("title totalAmount fundedAmount releasedAmount currency status createdAt"),
    PaymentLoadRequest.find({ user: user._id, status: "pending" }).sort({
      createdAt: -1,
    }),
  ]);

  const completedEarnings = completedContracts.reduce(
    (total, contract) => total + (Number(contract.releasedAmount || 0) || 0),
    0
  );
  const activeValue = activeContracts.reduce(
    (total, contract) =>
      total +
      Math.max(
        Number(contract.fundedAmount || contract.totalAmount || 0) -
          Number(contract.releasedAmount || 0),
        0
      ),
    0
  );

  return {
    wallet,
    summary: {
      completedContractEarnings: completedEarnings,
      activeContractValue: activeValue,
    completedContracts: completedContracts.length,
    activeContracts: activeContracts.length,
    canLoadFunds: roles.includes("client"),
      canWithdrawFunds: roles.includes("freelancer"),
    },
    completedContracts,
    pendingLoadRequests,
    pendingWithdrawalRequests: await WithdrawalRequest.find({
      user: user._id,
      status: "pending",
    }).sort({ createdAt: -1 }),
    monthlyFlow: Object.values(
      wallet.transactions.reduce((accumulator, transaction) => {
      const dateValue = transaction.createdAt || new Date();
      const monthKey = new Date(dateValue).toISOString().slice(0, 7);
      const amount = Number(transaction.amount || 0);

      if (!accumulator[monthKey]) {
        accumulator[monthKey] = {
          key: monthKey,
          incoming: 0,
          outgoing: 0,
        };
      }

      if (transaction.direction === "credit") {
        accumulator[monthKey].incoming += amount;
      } else {
        accumulator[monthKey].outgoing += amount;
      }

      return accumulator;
      }, {})
    ).sort((a, b) => a.key.localeCompare(b.key)),
  };
};

module.exports = {
  getOrCreateWallet,
  getWalletSummary,
  getFinanceSummary,
  linkLatestFundingTransactionToContract,
  listPendingPaymentLoadRequests,
  releasePendingContractFunding,
  refundContractFunds,
  requestWalletLoad,
  requestWalletWithdrawalWithProof,
  listWithdrawalRequests,
  releaseContractFunds,
  reviewPaymentLoadRequest,
  reviewWithdrawalRequest,
  reserveContractFunds,
  syncPendingContractFunding,
  updateFundingStatus,
};
