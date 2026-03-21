export const formatStatus = (status) => {
  if (!status) return "Unknown";
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const hasMilestones = (milestones) =>
  Array.isArray(milestones) && milestones.length > 0;

export const getMilestoneTotal = (milestones) =>
  Array.isArray(milestones)
    ? milestones.reduce((total, milestone) => {
        const value = Number(milestone?.value ?? 0);
        return total + (Number.isNaN(value) ? 0 : value);
      }, 0)
    : 0;

export const getCreatorLabel = (creatorAddress) =>
  creatorAddress?.name ||
  creatorAddress?.email ||
  creatorAddress ||
  "Unknown Creator";

export const formatBudget = (budget) => {
  if (budget?.type === "inspection_required") {
    return "Inspection Required";
  }
  if (!budget?.min) return "Negotiable";
  const currency = budget.currency || "NPR";
  if (budget.max) {
    return `${currency} ${budget.min.toLocaleString()}-${budget.max.toLocaleString()}`;
  }
  return `${currency} ${budget.min.toLocaleString()}`;
};

export const formatLocation = (
  location,
  {
    includeAddress = true,
    includeCity = true,
    includeDistrict = true,
    includeProvince = true,
  } = {},
) => {
  if (!location) return null;
  if (location.isRemote) return "Remote";
  const parts = [];

  if (includeAddress) parts.push(location.address);
  if (includeCity) parts.push(location.city);
  if (includeDistrict) parts.push(location.district);
  if (includeProvince) parts.push(location.province);

  const filtered = parts.filter(Boolean);
  return filtered.length > 0 ? filtered.join(", ") : null;
};
