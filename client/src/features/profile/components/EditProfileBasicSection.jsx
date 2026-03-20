export function EditProfileBasicSection({
  actionErrors,
  formData,
  handleChange,
  handleUploadedAvatar,
  removeVerificationDocument,
  removeAvatar,
}) {
  return (
    <>
      <div className="grid grid-cols-2" style={{ gap: "var(--space-4)" }}>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-name">
            Name
          </label>
          <input
            id="profile-name"
            className={`form-input ${
              actionErrors.name ? "form-input-error" : ""
            }`}
            value={formData.name}
            onChange={handleChange("name")}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-phone">
            Phone
          </label>
          <input
            id="profile-phone"
            className={`form-input ${
              actionErrors.phone ? "form-input-error" : ""
            }`}
            value={formData.phone}
            onChange={handleChange("phone")}
          />
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">Profile Photo</div>
        {formData.avatar ? (
          <div
            className="card-sm"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-3)",
              marginBottom: "var(--space-3)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
              }}
            >
              <img
                src={formData.avatar}
                alt={formData.name || "Profile photo"}
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "999px",
                  objectFit: "cover",
                  border: "1px solid var(--color-border)",
                }}
              />
              <div>
                <div style={{ fontWeight: "var(--font-weight-medium)" }}>
                  Profile image uploaded
                </div>
                <a
                  href={formData.avatar}
                  target="_blank"
                  rel="noreferrer"
                  className="text-link"
                >
                  Open image
                </a>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={removeAvatar}
            >
              Remove
            </button>
          </div>
        ) : (
          <p className="text-light" style={{ marginBottom: "var(--space-3)" }}>
            No profile photo uploaded yet.
          </p>
        )}
        {actionErrors.avatar ? (
          <p className="text-error text-sm" style={{ marginTop: 0 }}>
            {actionErrors.avatar}
          </p>
        ) : null}
        {handleUploadedAvatar}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="profile-bio">
          Bio
        </label>
        <textarea
          id="profile-bio"
          className={`form-input ${actionErrors.bio ? "form-input-error" : ""}`}
          rows={4}
          maxLength={1000}
          value={formData.bio}
          onChange={handleChange("bio")}
        />
      </div>

      <h3 style={{ marginBottom: "var(--space-4)" }}>Location</h3>
      <div className="grid grid-cols-2" style={{ gap: "var(--space-4)" }}>
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

      <h3
        id="verification"
        style={{
          marginBottom: "var(--space-4)",
          marginTop: "var(--space-6)",
          scrollMarginTop: "7rem",
        }}
      >
        Verification Documents
      </h3>

      <p className="text-light" style={{ marginBottom: "var(--space-4)" }}>
        Upload your ID or business verification documents here to unlock job
        posting, proposal sending, and contract signing.
      </p>

      {formData.verificationDocuments.length === 0 && (
        <p className="text-light" style={{ marginBottom: "var(--space-6)" }}>
          No verification documents added yet.
        </p>
      )}

      {formData.verificationDocuments.map((document, index) => (
        <div
          key={document.id}
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
            <strong>Document {index + 1}</strong>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <a
                href={document.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
              >
                Open
              </a>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => removeVerificationDocument(index)}
              >
                Remove
              </button>
            </div>
          </div>

          <div>
            <div
              style={{
                fontWeight: "var(--font-weight-medium)",
                marginBottom: "var(--space-1)",
              }}
            >
              {document.name || `Document ${index + 1}`}
            </div>
            <p className="text-light" style={{ margin: 0 }}>
              {document.resourceType || "raw"}
            </p>
          </div>
        </div>
      ))}
    </>
  );
}
