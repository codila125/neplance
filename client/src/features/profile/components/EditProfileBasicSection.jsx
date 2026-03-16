export function EditProfileBasicSection({
  actionErrors,
  formData,
  handleChange,
  removeVerificationDocument,
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
        <label className="form-label" htmlFor="profile-avatar">
          Avatar URL
        </label>
        <input
          id="profile-avatar"
          className={`form-input ${
            actionErrors.avatar ? "form-input-error" : ""
          }`}
          value={formData.avatar}
          onChange={handleChange("avatar")}
        />
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
        style={{
          marginBottom: "var(--space-4)",
          marginTop: "var(--space-6)",
        }}
      >
        Verification Documents
      </h3>

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
