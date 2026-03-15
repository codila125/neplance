"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { EditProfileBasicSection } from "@/features/profile/components/EditProfileBasicSection";
import { EditProfileFreelancerSection } from "@/features/profile/components/EditProfileFreelancerSection";
import { updateProfileAction } from "@/lib/actions/profile";

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

const INITIAL_ACTION_STATE = {
  message: "",
  errors: {},
};

export function EditProfilePageClient({ initialUser }) {
  const router = useRouter();
  const activeRole = initialUser?.role?.[0] || "freelancer";
  const [formData, setFormData] = useState(makeInitialForm(initialUser));
  const [actionState, formAction, isPending] = useActionState(
    updateProfileAction,
    INITIAL_ACTION_STATE,
  );

  const roleLabel = activeRole || initialUser?.role?.[0] || "freelancer";
  const isFreelancerProfile = roleLabel === "freelancer";
  const actionErrors = actionState?.errors || {};

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const handlePortfolioChange = (index, field, value) => {
    setFormData((previous) => {
      const nextPortfolio = [...previous.portfolio];
      nextPortfolio[index] = { ...nextPortfolio[index], [field]: value };
      return { ...previous, portfolio: nextPortfolio };
    });
  };

  const addPortfolioItem = () => {
    setFormData((previous) => ({
      ...previous,
      portfolio: [
        ...previous.portfolio,
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
    setFormData((previous) => ({
      ...previous,
      portfolio: previous.portfolio.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  const serializedPayload = JSON.stringify(formData);

  return (
    <div className="dashboard">
      <div className="container section-sm">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="btn btn-ghost"
          style={{ marginBottom: "var(--space-4)", padding: 0 }}
        >
          Back to Profile
        </button>

        <div className="card">
          <h1 style={{ marginBottom: "var(--space-6)" }}>Edit Profile</h1>
          {actionState?.message && (
            <div
              className="card-error"
              style={{ marginBottom: "var(--space-4)" }}
            >
              {actionState.message}
            </div>
          )}
          <form id="profile-edit-form" action={formAction}>
            <input type="hidden" name="payload" value={serializedPayload} />
            <EditProfileBasicSection
              actionErrors={actionErrors}
              formData={formData}
              handleChange={handleChange}
            />

            {isFreelancerProfile && (
              <EditProfileFreelancerSection
                addPortfolioItem={addPortfolioItem}
                formData={formData}
                handleChange={handleChange}
                handlePortfolioChange={handlePortfolioChange}
                removePortfolioItem={removePortfolioItem}
              />
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
                disabled={isPending}
              >
                {isPending ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
