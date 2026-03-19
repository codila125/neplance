const commonFields = [
  "name",
  "phone",
  "avatar",
  "bio",
  "location",
  "verificationDocuments",
  "verificationStatus",
  "verificationReviewedAt",
  "verificationReviewedBy",
  "verificationRejectionReason",
];

const freelancerOnlyFields = [
  "skills",
  "hourlyRate",
  "experienceLevel",
  "jobTypePreference",
  "availabilityStatus",
  "languages",
  "portfolio",
];

const hasFreelancerRole = (role = []) => {
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes("freelancer");
};

const pickUserFields = (payload = {}, role = []) => {
  const allowedFields = hasFreelancerRole(role)
    ? [...commonFields, ...freelancerOnlyFields]
    : commonFields;

  return allowedFields.reduce((acc, field) => {
    if (payload[field] !== undefined) {
      acc[field] = payload[field];
    }
    return acc;
  }, {});
};

module.exports = {
  commonFields,
  freelancerOnlyFields,
  hasFreelancerRole,
  pickUserFields,
};
