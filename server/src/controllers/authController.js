const catchAsync = require("../utils/catchAsync");
const User = require("../models/User");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { freelancerOnlyFields } = require("../utils/userFields");
const { createAdminNotifications } = require("../services/notificationService");

const profileFields = [
  "phone",
  "avatar",
  "bio",
  "location",
  "verificationDocuments",
];

const pickProfileFields = (payload = {}) => {
  const allowedFields = [...profileFields, ...freelancerOnlyFields];
  return allowedFields.reduce((acc, field) => {
    if (payload[field] !== undefined) {
      acc[field] = payload[field];
    }
    return acc;
  }, {});
};

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId, type: "access" }, process.env.AUTH_JWT_SECRET, {
    expiresIn: process.env.AUTH_ACCESS_TOKEN_EXPIRY || "15m",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId, type: "refresh" }, process.env.AUTH_JWT_SECRET, {
    expiresIn: process.env.AUTH_REFRESH_TOKEN_EXPIRY || "7d",
  });
};

const getAccessCookieOptions = () => {
  const options = {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  return options;
};

const getCookieOptions = (expires) => {
  const options = {
    expires,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  return options;
};

const createSendTokens = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const refreshCookieExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const refreshCookieOptions = getCookieOptions(refreshCookieExpiry);
  const accessCookieOptions = getAccessCookieOptions();

  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  res.cookie("neplanceAccessToken", accessToken, accessCookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    accessToken,
    data: {
      user,
    },
  });
};

const register = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, role } = req.body;
  const profilePayload = pickProfileFields(req.body);

  const freshUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role,
    ...profilePayload,
  });

  await createAdminNotifications({
    actor: freshUser._id,
    type: "admin.user_registered",
    title: "New user registered",
    message: `${freshUser.name} created a new Neplance account.`,
    link: "/admin/users",
    metadata: {
      user: freshUser._id,
    },
  });

  createSendTokens(freshUser, 201, res);
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    throw new AppError("Please enter your email or password", 400);

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password)))
    throw new AppError("Invalid email or password", 401);

  createSendTokens(user, 200, res);
});

const refreshAccessToken = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError("No refresh token provided. Please log in again.", 401);
  }

  const decoded = await promisify(jwt.verify)(refreshToken, process.env.AUTH_JWT_SECRET).catch(
    () => {
      throw new AppError("Invalid or expired refresh token. Please log in again.", 401);
    }
  );

  if (decoded.type !== "refresh") {
    throw new AppError("Invalid token type. Please log in again.", 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError("User no longer exists. Please log in again.", 401);
  }

  const accessToken = generateAccessToken(user._id);
  const accessCookieOptions = getAccessCookieOptions();

  res.cookie("neplanceAccessToken", accessToken, accessCookieOptions);

  res.status(200).json({
    status: "success",
    accessToken,
  });
});

const logout = (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  res.clearCookie("refreshToken", cookieOptions);
  res.clearCookie("neplanceAccessToken", {
    sameSite: "lax",
    path: "/",
    ...(process.env.NODE_ENV === "production" ? { secure: true } : {}),
  });

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.status(200).json({ status: "success" });
};

const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  getUser,
  refreshAccessToken,
};
