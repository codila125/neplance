const crypto = require("crypto");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const getCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const baseFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || "neplance";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new AppError("Cloudinary upload configuration is missing.", 500);
  }

  return { apiKey, apiSecret, baseFolder, cloudName };
};

const signCloudinaryParams = (params, apiSecret) => {
  const signatureBase = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${signatureBase}${apiSecret}`)
    .digest("hex");
};

const createUploadSignature = catchAsync(async (req, res) => {
  const { cloudName, apiKey, apiSecret, baseFolder } = getCloudinaryConfig();
  const folderSegment = req.body?.folder
    ? String(req.body.folder).trim().replace(/^\/+|\/+$/g, "")
    : "verification-documents";
  const resourceType = req.body?.resourceType
    ? String(req.body.resourceType).trim()
    : "auto";
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `${baseFolder}/${folderSegment}`;
  const paramsToSign = {
    folder,
    timestamp,
  };

  const signature = signCloudinaryParams(paramsToSign, apiSecret);

  res.status(200).json({
    status: "success",
    data: {
      apiKey,
      cloudName,
      folder,
      resourceType,
      signature,
      timestamp,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    },
  });
});

module.exports = {
  createUploadSignature,
};
