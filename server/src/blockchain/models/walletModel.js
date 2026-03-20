const extractWalletId = (payload = {}) => {
  const address = payload?.address;
  if (typeof address !== "string") {
    return null;
  }

  const normalizedAddress = address.trim();
  return normalizedAddress || null;
};

module.exports = {
  extractWalletId,
};
