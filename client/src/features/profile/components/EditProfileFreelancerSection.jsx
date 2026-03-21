export function EditProfileFreelancerSection({
  addPortfolioItem,
  formData,
  handleChange,
  handlePortfolioChange,
  removePortfolioItem,
}) {
  return (
    <>
      <h3 style={{ marginBottom: "var(--space-4)" }}>Professional Details</h3>
      <div className="grid grid-cols-2" style={{ gap: "var(--space-4)" }}>
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
          <label className="form-label" htmlFor="profile-physical-services">
            Physical Services Offered
          </label>
          <input
            id="profile-physical-services"
            className="form-input"
            value={formData.physicalServicesOffered}
            onChange={handleChange("physicalServicesOffered")}
            placeholder="Plumbing, Carpentry, Electrician"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-service-areas">
            Service Areas
          </label>
          <input
            id="profile-service-areas"
            className="form-input"
            value={formData.serviceAreas}
            onChange={handleChange("serviceAreas")}
            placeholder="Kathmandu, Lalitpur, Bhaktapur"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-hourly-rate">
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
          <label className="form-label" htmlFor="profile-experience">
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
          <label className="form-label" htmlFor="profile-availability">
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
        <div className="form-group">
          <label className="form-label" htmlFor="profile-license">
            License / Certification
          </label>
          <input
            id="profile-license"
            className="form-input"
            value={formData.licenseOrCertification}
            onChange={handleChange("licenseOrCertification")}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-trade-exp">
            Trade Experience (years)
          </label>
          <input
            id="profile-trade-exp"
            type="number"
            min="0"
            className="form-input"
            value={formData.tradeExperienceYears}
            onChange={handleChange("tradeExperienceYears")}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-onsite-available">
            On-site Available
          </label>
          <select
            id="profile-onsite-available"
            className="form-select"
            value={formData.onsiteAvailable ? "yes" : "no"}
            onChange={(event) =>
              handleChange("onsiteAvailable")({
                target: { value: event.target.value === "yes" },
              })
            }
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-own-tools">
            Has Own Tools
          </label>
          <select
            id="profile-own-tools"
            className="form-select"
            value={formData.hasOwnTools ? "yes" : "no"}
            onChange={(event) =>
              handleChange("hasOwnTools")({
                target: { value: event.target.value === "yes" },
              })
            }
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
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
        <p className="text-light" style={{ marginBottom: "var(--space-6)" }}>
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
          <div className="grid grid-cols-2" style={{ gap: "var(--space-4)" }}>
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
                  handlePortfolioChange(index, "title", event.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor={`portfolio-url-${index}`}>
                Project URL
              </label>
              <input
                id={`portfolio-url-${index}`}
                className="form-input"
                value={item.projectUrl}
                onChange={(event) =>
                  handlePortfolioChange(index, "projectUrl", event.target.value)
                }
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor={`portfolio-desc-${index}`}>
              Description
            </label>
            <textarea
              id={`portfolio-desc-${index}`}
              className="form-input"
              rows={3}
              value={item.description}
              onChange={(event) =>
                handlePortfolioChange(index, "description", event.target.value)
              }
            />
          </div>
          <div className="grid grid-cols-2" style={{ gap: "var(--space-4)" }}>
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
                  handlePortfolioChange(index, "imageUrls", event.target.value)
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
                  handlePortfolioChange(index, "skills", event.target.value)
                }
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor={`portfolio-date-${index}`}>
              Completed At
            </label>
            <input
              id={`portfolio-date-${index}`}
              type="date"
              className="form-input"
              value={item.completedAt}
              onChange={(event) =>
                handlePortfolioChange(index, "completedAt", event.target.value)
              }
            />
          </div>
        </div>
      ))}
    </>
  );
}
