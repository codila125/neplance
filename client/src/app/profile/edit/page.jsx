"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiCall } from "@/services/api";
import { useAuthGate } from "@/shared/hooks/useAuthGate";
import { profileUpdateSchema, validateForm } from "@/shared/lib/validation";
import { Navbar } from "@/shared/navigation/Navbar";

const parseCsv = (value = "") =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toCsv = (value = []) => (Array.isArray(value) ? value.join(", ") : "");

const createPortfolioItemId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const makeInitialForm = (user) => ({
  name: user?.name || "",
  phone: user?.phone || "",
  avatar: user?.avatar || "",
  bio: user?.bio || "",
  address: user?.location?.address || "",
  city: user?.location?.city || "",
  district: user?.location?.district || "",
  province: user?.location?.province || "",
  lat: user?.location?.coordinates?.lat ?? "",
  lng: user?.location?.coordinates?.lng ?? "",
  skills: toCsv(user?.skills),
  hourlyRate: user?.hourlyRate ?? 0,
  experienceLevel: user?.experienceLevel || "entry",
  jobTypePreference: user?.jobTypePreference || "digital",
  availabilityStatus: user?.availabilityStatus || "available",
  languages: toCsv(user?.languages),
  portfolio: Array.isArray(user?.portfolio)
    ? user.portfolio.map((item) => ({
        id: item?._id || item?.id || createPortfolioItemId(),
        title: item?.title || "",
        description: item?.description || "",
        imageUrls: toCsv(item?.imageUrls),
        projectUrl: item?.projectUrl || "",
        skills: toCsv(item?.skills),
        completedAt: item?.completedAt
          ? new Date(item.completedAt).toISOString().slice(0, 10)
          : "",
      }))
    : [],
});

export default function EditProfilePage() {
  const { user, currentRole, isHydrated, logout, switchRole, updateUser } =
    useAuthGate({
      mode: "require-auth",
    });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState(makeInitialForm(null));
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setFormData(makeInitialForm(user));
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleRoleSwitch = (updatedUser) => {
    switchRole(updatedUser);
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePortfolioChange = (index, field, value) => {
    setFormData((prev) => {
      const nextPortfolio = [...prev.portfolio];
      nextPortfolio[index] = { ...nextPortfolio[index], [field]: value };
      return { ...prev, portfolio: nextPortfolio };
    });
  };

  const addPortfolioItem = () => {
    setFormData((prev) => ({
      ...prev,
      portfolio: [
        ...prev.portfolio,
        {
          id: createPortfolioItemId(),
          title: "",
          description: "",
          imageUrls: "",
          projectUrl: "",
          skills: "",
          completedAt: "",
        },
      ],
    }));
  };

  const removePortfolioItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFormErrors({});
    setIsSaving(true);

    try {
      const location = {
        address: formData.address.trim(),
        city: formData.city.trim(),
        district: formData.district.trim(),
        province: formData.province.trim(),
      };

      const hasCoordinates = formData.lat !== "" || formData.lng !== "";
      let lat, lng;
      if (hasCoordinates) {
        lat = formData.lat === "" ? undefined : Number(formData.lat);
        lng = formData.lng === "" ? undefined : Number(formData.lng);
      }

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        avatar: formData.avatar.trim() || null,
        bio: formData.bio.trim(),
        address: location.address || undefined,
        city: location.city || undefined,
        district: location.district || undefined,
        province: location.province || undefined,
        lat,
        lng,
      };

      if (isFreelancerProfile) {
        payload.skills = formData.skills;
        payload.hourlyRate = Number(formData.hourlyRate) || 0;
        payload.experienceLevel = formData.experienceLevel;
        payload.jobTypePreference = formData.jobTypePreference;
        payload.availabilityStatus = formData.availabilityStatus;
        payload.languages = formData.languages;
        payload.portfolio = formData.portfolio.map((item) => ({
          title: item.title?.trim() || undefined,
          description: item.description?.trim() || undefined,
          imageUrls: item.imageUrls || undefined,
          projectUrl: item.projectUrl?.trim() || undefined,
          skills: item.skills || undefined,
          completedAt: item.completedAt || undefined,
        }));
      }

      const { errors: validationErrors, data } = validateForm(
        profileUpdateSchema,
        payload,
      );

      if (validationErrors) {
        setFormErrors(validationErrors);
        setIsSaving(false);
        return;
      }

      const locationPayload = { ...location };
      if (hasCoordinates) {
        const coordinates = {};
        if (data.lat !== undefined) coordinates.lat = data.lat;
        if (data.lng !== undefined) coordinates.lng = data.lng;
        if (Object.keys(coordinates).length) {
          locationPayload.coordinates = coordinates;
        }
      }

      const finalPayload = {
        name: data.name,
        phone: data.phone,
        avatar: data.avatar,
        bio: data.bio,
        location: locationPayload,
      };

      if (isFreelancerProfile) {
        finalPayload.skills = parseCsv(formData.skills);
        finalPayload.hourlyRate = data.hourlyRate;
        finalPayload.experienceLevel = data.experienceLevel;
        finalPayload.jobTypePreference = data.jobTypePreference;
        finalPayload.availabilityStatus = data.availabilityStatus;
        finalPayload.languages = parseCsv(formData.languages);
        finalPayload.portfolio = formData.portfolio.map((item) => ({
          title: item.title?.trim(),
          description: item.description?.trim(),
          imageUrls: parseCsv(item.imageUrls || ""),
          projectUrl: item.projectUrl?.trim(),
          skills: parseCsv(item.skills || ""),
          completedAt: item.completedAt || undefined,
        }));
      }

      const response = await apiCall("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(finalPayload),
      });

      const updated = response?.data?.user;
      if (updated) {
        updateUser(updated);
      }

      setFormSuccess("Profile updated successfully.");
      setTimeout(() => router.push("/profile"), 1500);
    } catch (error) {
      setFormError(error.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isHydrated || !user) return null;

  const roleLabel = currentRole || user.role?.[0] || "freelancer";
  const isFreelancerProfile = roleLabel === "freelancer";

  return (
    <>
      <Navbar
        user={user}
        onLogout={handleLogout}
        onRoleSwitch={handleRoleSwitch}
      />

      <div className="dashboard">
        <div className="container section-sm">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="btn btn-ghost"
            style={{ marginBottom: "var(--space-4)", padding: 0 }}
          >
            ← Back to Profile
          </button>

          <div className="card">
            <h1 style={{ marginBottom: "var(--space-6)" }}>Edit Profile</h1>

            {formError && (
              <div
                className="card-error"
                style={{ marginBottom: "var(--space-4)" }}
              >
                {formError}
              </div>
            )}
            {formSuccess && (
              <div
                style={{
                  marginBottom: "var(--space-4)",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-primary-lightest)",
                  color: "var(--color-primary-dark)",
                }}
              >
                {formSuccess}
              </div>
            )}

            <form id="profile-edit-form" onSubmit={handleSaveProfile}>
              <div
                className="grid grid-cols-2"
                style={{ gap: "var(--space-4)" }}
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-name">
                    Name
                  </label>
                  <input
                    id="profile-name"
                    className={`form-input ${formErrors.name ? "form-input-error" : ""}`}
                    value={formData.name}
                    onChange={handleChange("name")}
                    required
                  />
                  {formErrors.name && (
                    <p
                      style={{
                        color: "var(--color-error)",
                        fontSize: "0.75rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      {formErrors.name}
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-phone">
                    Phone
                  </label>
                  <input
                    id="profile-phone"
                    className={`form-input ${formErrors.phone ? "form-input-error" : ""}`}
                    value={formData.phone}
                    onChange={handleChange("phone")}
                  />
                  {formErrors.phone && (
                    <p
                      style={{
                        color: "var(--color-error)",
                        fontSize: "0.75rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      {formErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-avatar">
                  Avatar URL
                </label>
                <input
                  id="profile-avatar"
                  className={`form-input ${formErrors.avatar ? "form-input-error" : ""}`}
                  value={formData.avatar}
                  onChange={handleChange("avatar")}
                />
                {formErrors.avatar && (
                  <p
                    style={{
                      color: "var(--color-error)",
                      fontSize: "0.75rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    {formErrors.avatar}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-bio">
                  Bio
                </label>
                <textarea
                  id="profile-bio"
                  className={`form-input ${formErrors.bio ? "form-input-error" : ""}`}
                  rows={4}
                  maxLength={1000}
                  value={formData.bio}
                  onChange={handleChange("bio")}
                />
                {formErrors.bio && (
                  <p
                    style={{
                      color: "var(--color-error)",
                      fontSize: "0.75rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    {formErrors.bio}
                  </p>
                )}
              </div>

              <h3 style={{ marginBottom: "var(--space-4)" }}>Location</h3>
              <div
                className="grid grid-cols-2"
                style={{ gap: "var(--space-4)" }}
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-address">
                    Address
                  </label>
                  <input
                    id="profile-address"
                    className="form-input"
                    value={formData.address}
                    onChange={handleChange("address")}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-city">
                    City
                  </label>
                  <input
                    id="profile-city"
                    className="form-input"
                    value={formData.city}
                    onChange={handleChange("city")}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-district">
                    District
                  </label>
                  <input
                    id="profile-district"
                    className="form-input"
                    value={formData.district}
                    onChange={handleChange("district")}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-province">
                    Province
                  </label>
                  <input
                    id="profile-province"
                    className="form-input"
                    value={formData.province}
                    onChange={handleChange("province")}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-lat">
                    Latitude
                  </label>
                  <input
                    id="profile-lat"
                    type="number"
                    step="any"
                    className="form-input"
                    value={formData.lat}
                    onChange={handleChange("lat")}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-lng">
                    Longitude
                  </label>
                  <input
                    id="profile-lng"
                    type="number"
                    step="any"
                    className="form-input"
                    value={formData.lng}
                    onChange={handleChange("lng")}
                  />
                </div>
              </div>

              {isFreelancerProfile && (
                <>
                  <h3 style={{ marginBottom: "var(--space-4)" }}>
                    Professional Details
                  </h3>
                  <div
                    className="grid grid-cols-2"
                    style={{ gap: "var(--space-4)" }}
                  >
                    <div className="form-group">
                      <label className="form-label" htmlFor="profile-skills">
                        Skills (comma separated)
                      </label>
                      <input
                        id="profile-skills"
                        className="form-input"
                        value={formData.skills}
                        onChange={handleChange("skills")}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="profile-languages">
                        Languages (comma separated)
                      </label>
                      <input
                        id="profile-languages"
                        className="form-input"
                        value={formData.languages}
                        onChange={handleChange("languages")}
                      />
                    </div>
                    <div className="form-group">
                      <label
                        className="form-label"
                        htmlFor="profile-hourly-rate"
                      >
                        Hourly Rate (NPR)
                      </label>
                      <input
                        id="profile-hourly-rate"
                        type="number"
                        min="0"
                        className="form-input"
                        value={formData.hourlyRate}
                        onChange={handleChange("hourlyRate")}
                      />
                    </div>
                    <div className="form-group">
                      <label
                        className="form-label"
                        htmlFor="profile-experience"
                      >
                        Experience Level
                      </label>
                      <select
                        id="profile-experience"
                        className="form-select"
                        value={formData.experienceLevel}
                        onChange={handleChange("experienceLevel")}
                      >
                        <option value="entry">Entry</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="profile-job-type">
                        Job Type Preference
                      </label>
                      <select
                        id="profile-job-type"
                        className="form-select"
                        value={formData.jobTypePreference}
                        onChange={handleChange("jobTypePreference")}
                      >
                        <option value="digital">Digital</option>
                        <option value="physical">Physical</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label
                        className="form-label"
                        htmlFor="profile-availability"
                      >
                        Availability Status
                      </label>
                      <select
                        id="profile-availability"
                        className="form-select"
                        value={formData.availabilityStatus}
                        onChange={handleChange("availabilityStatus")}
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "var(--space-4)",
                      marginTop: "var(--space-6)",
                    }}
                  >
                    <h3 style={{ marginBottom: 0 }}>Portfolio</h3>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={addPortfolioItem}
                    >
                      Add Project
                    </button>
                  </div>

                  {formData.portfolio.length === 0 && (
                    <p
                      className="text-light"
                      style={{ marginBottom: "var(--space-6)" }}
                    >
                      No portfolio projects yet.
                    </p>
                  )}

                  {formData.portfolio.map((item, index) => (
                    <div
                      key={item.id}
                      className="card-sm"
                      style={{ marginBottom: "var(--space-4)" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "var(--space-3)",
                        }}
                      >
                        <strong>Project {index + 1}</strong>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => removePortfolioItem(index)}
                        >
                          Remove
                        </button>
                      </div>
                      <div
                        className="grid grid-cols-2"
                        style={{ gap: "var(--space-4)" }}
                      >
                        <div className="form-group">
                          <label
                            className="form-label"
                            htmlFor={`portfolio-title-${index}`}
                          >
                            Title
                          </label>
                          <input
                            id={`portfolio-title-${index}`}
                            className="form-input"
                            value={item.title}
                            onChange={(event) =>
                              handlePortfolioChange(
                                index,
                                "title",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label
                            className="form-label"
                            htmlFor={`portfolio-url-${index}`}
                          >
                            Project URL
                          </label>
                          <input
                            id={`portfolio-url-${index}`}
                            className="form-input"
                            value={item.projectUrl}
                            onChange={(event) =>
                              handlePortfolioChange(
                                index,
                                "projectUrl",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label
                          className="form-label"
                          htmlFor={`portfolio-desc-${index}`}
                        >
                          Description
                        </label>
                        <textarea
                          id={`portfolio-desc-${index}`}
                          className="form-input"
                          rows={3}
                          value={item.description}
                          onChange={(event) =>
                            handlePortfolioChange(
                              index,
                              "description",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <div
                        className="grid grid-cols-2"
                        style={{ gap: "var(--space-4)" }}
                      >
                        <div className="form-group">
                          <label
                            className="form-label"
                            htmlFor={`portfolio-images-${index}`}
                          >
                            Image URLs (comma separated)
                          </label>
                          <input
                            id={`portfolio-images-${index}`}
                            className="form-input"
                            value={item.imageUrls}
                            onChange={(event) =>
                              handlePortfolioChange(
                                index,
                                "imageUrls",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label
                            className="form-label"
                            htmlFor={`portfolio-skills-${index}`}
                          >
                            Skills (comma separated)
                          </label>
                          <input
                            id={`portfolio-skills-${index}`}
                            className="form-input"
                            value={item.skills}
                            onChange={(event) =>
                              handlePortfolioChange(
                                index,
                                "skills",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label
                          className="form-label"
                          htmlFor={`portfolio-date-${index}`}
                        >
                          Completed At
                        </label>
                        <input
                          id={`portfolio-date-${index}`}
                          type="date"
                          className="form-input"
                          value={item.completedAt}
                          onChange={(event) =>
                            handlePortfolioChange(
                              index,
                              "completedAt",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "var(--space-3)",
                  marginTop: "var(--space-8)",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => router.push("/profile")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="profile-edit-form"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
