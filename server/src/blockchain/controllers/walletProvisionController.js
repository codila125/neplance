const { createFoedusWallet } = require("../services/blockchainService");

const provisionWalletId = createFoedusWallet;

module.exports = {
  provisionWalletId,
};
