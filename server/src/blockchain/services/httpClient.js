const AppError = require("../../utils/appError");

const BLOCKCHAIN_SETTLE_DELAY_MS = Math.max(
  0,
  Number(process.env.BLOCKCHAIN_SETTLE_DELAY_MS) || 900
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForBlockchainSettle = async () => {
  if (BLOCKCHAIN_SETTLE_DELAY_MS > 0) {
    await sleep(BLOCKCHAIN_SETTLE_DELAY_MS);
  }
};

const getErrorReason = async (response) => {
  const errorText = await response.text().catch(() => "");
  if (typeof errorText === "string" && errorText.trim()) {
    return errorText.trim().slice(0, 240);
  }
  return `HTTP ${response.status}`;
};

const parseJsonOrThrow = async (response, fallbackMessage) => {
  try {
    return await response.json();
  } catch {
    throw new AppError(fallbackMessage, 502);
  }
};

const getJson = async (url, fallbackMessage) => {
  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    throw new AppError("Unable to connect to Foedus blockchain service", 503);
  }

  if (!response.ok) {
    const reason = await getErrorReason(response);
    throw new AppError(`Foedus blockchain request failed: ${reason}`, 502);
  }

  return parseJsonOrThrow(response, fallbackMessage);
};

const postJson = async (url, payload, options = {}) => {
  const {
    waitAfter = false,
    fallbackMessage = "Invalid response from Foedus blockchain",
  } = options;

  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AppError("Unable to connect to Foedus blockchain service", 503);
  }

  if (!response.ok) {
    const reason = await getErrorReason(response);
    throw new AppError(`Foedus blockchain request failed: ${reason}`, 502);
  }

  const data = await parseJsonOrThrow(response, fallbackMessage);

  if (waitAfter) {
    await waitForBlockchainSettle();
  }

  return data;
};

module.exports = {
  BLOCKCHAIN_SETTLE_DELAY_MS,
  getJson,
  postJson,
  sleep,
};
