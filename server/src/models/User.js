const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const verificationDocumentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    url: {
      type: String,
      required: true,
      validate: [validator.isURL, "Please provide a valid document URL"],
    },
    publicId: {
      type: String,
      trim: true,
    },
    resourceType: {
      type: String,
      trim: true,
      default: "raw",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  role: {
    type: [String],
    enum: ["admin", "client", "freelancer"],
    required: true,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
  },
  avatar: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    maxlength: 1000,
  },
  location: {
    address: String,
    city: String,
    district: String,
    province: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  skills: [{ type: String }],
  hourlyRate: {
    type: Number,
    default: 0,
  },
  experienceLevel: {
    type: String,
    enum: ["entry", "intermediate", "expert"],
    default: "entry",
  },
  jobTypePreference: {
    type: String,
    enum: ["digital", "physical", "both"],
    default: "digital",
  },
  availabilityStatus: {
    type: String,
    enum: ["available", "busy", "unavailable"],
    default: "available",
  },
  languages: [{ type: String }],
  portfolio: [
    {
      title: String,
      description: String,
      imageUrls: [String],
      projectUrl: String,
      skills: [String],
      completedAt: Date,
    },
  ],
  verificationDocuments: [verificationDocumentSchema],
  savedJobs: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Job",
    },
  ],
  verificationStatus: {
    type: String,
    enum: ["not_submitted", "pending", "verified", "rejected"],
    default: "not_submitted",
  },
  verificationReviewedAt: Date,
  verificationReviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  verificationRejectionReason: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 4,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  //   passwordChangedAt: Date,
  //   passwordResetToken: String,
  //   passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.deactivate = async function () {
  this.active = false;
  return this.save();
};

const User = mongoose.model("User", userSchema);

module.exports = User;
