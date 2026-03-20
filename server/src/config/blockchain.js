const AppError = require("../utils/appError");
const logger = require("../utils/logger");

const resolveBlockchainBaseUrl = () => {
  const baseUrl = process.env.BLOCKCHAIN_BASE_URL;
  if (!baseUrl) {
    throw new AppError("BLOCKCHAIN_BASE_URL is not configured", 500);
  }

  return baseUrl.replace(/\/+$/, "");
};

const checkBlockchainConnection = async () => {
  const healthUrl = `${resolveBlockchainBaseUrl()}/health`;
  let response;

  try {
    response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    throw new AppError("Unable to connect to Foedus blockchain service", 503);
  }

  if (!response.ok) {
    throw new AppError("Foedus blockchain health check failed", 502);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new AppError("Invalid Foedus blockchain health response", 502);
  }

  if (payload?.status !== "ok") {
    throw new AppError("Foedus blockchain service is not healthy", 502);
  }

  logger.info("Blockchain connected successfully");
  return { status: "ok" };
};

module.exports = {
  resolveBlockchainBaseUrl,
  checkBlockchainConnection,
};
