const Contract = require("../models/Contract");
const Wallet = require("../models/Wallet");
const AppError = require("../utils/appError");
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
    createdAt: transaction.createdAt || new Date(),
  });
};

const loadWalletFunds = async ({ userId, amount }) => {
  const normalizedAmount = Number(amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new AppError("Wallet load amount must be greater than zero", 400);
  }

  const wallet = await getOrCreateWallet(userId);
  wallet.balance += normalizedAmount;
  wallet.totalLoaded += normalizedAmount;
  pushTransaction(wallet, {
    type: "wallet_load",
    amount: normalizedAmount,
    direction: "credit",
    description: "Dummy wallet load",
  });
  wallet.updatedAt = new Date();
  await wallet.save();

  return wallet;
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

const reserveContractFunds = async ({
  clientId,
  contractId,
  contractTitle,
  amount,
}) => {
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

  if (clientWallet.heldBalance < normalizedAmount) {
    throw new AppError("Client wallet does not have enough held funds", 400);
  }

  clientWallet.heldBalance -= normalizedAmount;
  clientWallet.totalSpent += normalizedAmount;
  pushTransaction(clientWallet, {
    type: "contract_release",
    amount: normalizedAmount,
    direction: "debit",
    description,
  });

  freelancerWallet.balance += normalizedAmount;
  freelancerWallet.totalEarned += normalizedAmount;
  pushTransaction(freelancerWallet, {
    type: "contract_release",
    amount: normalizedAmount,
    direction: "credit",
    description,
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

  const [completedContracts, activeContracts] = await Promise.all([
    Contract.find({
      freelancer: user._id,
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
    },
    completedContracts,
  };
};

module.exports = {
  getOrCreateWallet,
  getWalletSummary,
  loadWalletFunds,
  refundContractFunds,
  releaseContractFunds,
  reserveContractFunds,
  updateFundingStatus,
};
