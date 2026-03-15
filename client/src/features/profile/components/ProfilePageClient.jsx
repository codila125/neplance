"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { EmptyState } from "@/features/dashboard/components/EmptyState";
import { JobCard } from "@/features/dashboard/components/JobCard";
import { JobModal } from "@/features/dashboard/components/JobModal";
import {
  approveMilestoneAction,
  submitMilestoneAction,
} from "@/lib/actions/jobs";
import { deleteAccountAction } from "@/lib/actions/users";

export function ProfilePageClient({
  initialCompletedJobs,
  initialDeleteEligibility,
  initialUser,
}) {
  const router = useRouter();
  const user = initialUser;
  const activeRole = user?.role?.[0] || "freelancer";
  const [selectedJob, setSelectedJob] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateError, setDeactivateError] = useState("");
  const [deleteEligibility] = useState(initialDeleteEligibility);
  const [completedJobs] = useState(initialCompletedJobs);
  const [isSubmittingMilestone, startMilestoneSubmitTransition] =
    useTransition();
  const [isApprovingMilestone, startMilestoneApproveTransition] =
    useTransition();

  const handleViewDetails = (job) => setSelectedJob(job);
  const handleCloseModal = () => setSelectedJob(null);

  const handleSubmitMilestone = async (jobId, index, evidence) => {
    startMilestoneSubmitTransition(async () => {
      const result = await submitMilestoneAction(jobId, index, evidence);
      setSelectedJob(result.data);
    });
  };

  const handleApproveMilestone = async (jobId, index) => {
    startMilestoneApproveTransition(async () => {
      const result = await approveMilestoneAction(jobId, index);
      setSelectedJob(result.data);
    });
  };

  const profileLocation = useMemo(() => {
    if (!user?.location) return "N/A";
    const values = [
      user.location.address,
      user.location.city,
      user.location.district,
      user.location.province,
    ].filter(Boolean);
    return values.length ? values.join(", ") : "N/A";
  }, [user]);

  const handleDeactivateAccount = async () => {
    setIsDeactivating(true);
    try {
      await deleteAccountAction();
    } catch (error) {
      setDeactivateError(error.message || "Failed to deactivate account.");
      setIsDeactivating(false);
      setShowDeactivateModal(false);
    }
  };

  const averageRating = 0.0;
  const roleLabel = activeRole || user?.role?.[0] || "freelancer";
  const isFreelancerProfile = roleLabel === "freelancer";

  return (
    <>
      <div className="dashboard">
        <div className="container section-sm">
          <div className="card" style={{ marginBottom: "var(--space-8)" }}>
            <div
              style={{
                display: "flex",
                gap: "var(--space-8)",
                alignItems: "start",
              }}
            >
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  backgroundColor: user?.avatar
                    ? "transparent"
                    : "var(--color-primary-lightest)",
                  color: "var(--color-primary)",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={120}
                    height={120}
                    unoptimized
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "var(--text-5xl)",
                      fontWeight: "var(--font-weight-bold)",
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h1 style={{ marginBottom: "var(--space-2)" }}>{user?.name}</h1>
                <p
                  className="text-light"
                  style={{ marginBottom: "var(--space-6)" }}
                >
                  {user?.email}
                </p>

                <p
                  className="text-light"
                  style={{ marginBottom: "var(--space-6)" }}
                >
                  {user?.bio || "No bio added yet."}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "var(--space-8)",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-light)",
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      Role
                    </div>
                    <span className="badge badge-success">{roleLabel}</span>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-light)",
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      Phone
                    </div>
                    <div>{user?.phone || "N/A"}</div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-light)",
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      Completed Projects
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-2xl)",
                        fontWeight: "var(--font-weight-semibold)",
                      }}
                    >
                      {completedJobs.length}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-light)",
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      Rating
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-2xl)",
                        fontWeight: "var(--font-weight-semibold)",
                      }}
                    >
                      {averageRating > 0 ? `${averageRating} /5` : "N/A"}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-light)",
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      Location
                    </div>
                    <div>{profileLocation}</div>
                  </div>
                  {isFreelancerProfile && (
                    <>
                      <div>
                        <div
                          style={{
                            fontSize: "var(--text-sm)",
                            color: "var(--color-text-light)",
                            marginBottom: "var(--space-1)",
                          }}
                        >
                          Hourly Rate
                        </div>
                        <div>NPR {user?.hourlyRate || 0}</div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "var(--text-sm)",
                            color: "var(--color-text-light)",
                            marginBottom: "var(--space-1)",
                          }}
                        >
                          Experience
                        </div>
                        <div>{user?.experienceLevel || "entry"}</div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "var(--text-sm)",
                            color: "var(--color-text-light)",
                            marginBottom: "var(--space-1)",
                          }}
                        >
                          Job Type
                        </div>
                        <div>{user?.jobTypePreference || "digital"}</div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "var(--text-sm)",
                            color: "var(--color-text-light)",
                            marginBottom: "var(--space-1)",
                          }}
                        >
                          Availability
                        </div>
                        <span className="badge badge-primary">
                          {user?.availabilityStatus || "available"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div
                  style={{
                    marginTop: "var(--space-6)",
                    display: "flex",
                    gap: "var(--space-3)",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => router.push("/profile/edit")}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isFreelancerProfile && (
            <>
              <div className="card" style={{ marginBottom: "var(--space-8)" }}>
                <h2 style={{ marginBottom: "var(--space-4)" }}>
                  Skills and Languages
                </h2>
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <div
                    style={{
                      marginBottom: "var(--space-2)",
                      fontWeight: "var(--font-weight-medium)",
                    }}
                  >
                    Skills
                  </div>
                  {Array.isArray(user?.skills) && user.skills.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "var(--space-2)",
                        flexWrap: "wrap",
                      }}
                    >
                      {user.skills.map((skill) => (
                        <span key={skill} className="badge badge-success">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-light">No skills added.</p>
                  )}
                </div>
                <div>
                  <div
                    style={{
                      marginBottom: "var(--space-2)",
                      fontWeight: "var(--font-weight-medium)",
                    }}
                  >
                    Languages
                  </div>
                  {Array.isArray(user?.languages) &&
                  user.languages.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "var(--space-2)",
                        flexWrap: "wrap",
                      }}
                    >
                      {user.languages.map((language) => (
                        <span key={language} className="badge badge-info">
                          {language}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-light">No languages added.</p>
                  )}
                </div>
              </div>

              <div className="card" style={{ marginBottom: "var(--space-8)" }}>
                <h2 style={{ marginBottom: "var(--space-4)" }}>Portfolio</h2>
                {Array.isArray(user?.portfolio) && user.portfolio.length > 0 ? (
                  <div style={{ display: "grid", gap: "var(--space-4)" }}>
                    {user.portfolio.map((item, index) => (
                      <article
                        key={`${item.title || "portfolio"}-${index}`}
                        className="card-sm"
                      >
                        <h3 style={{ marginBottom: "var(--space-2)" }}>
                          {item.title || "Untitled Project"}
                        </h3>
                        <p
                          className="text-light"
                          style={{ marginBottom: "var(--space-3)" }}
                        >
                          {item.description || "No description."}
                        </p>
                        {Array.isArray(item.skills) &&
                          item.skills.length > 0 && (
                            <div
                              style={{
                                marginBottom: "var(--space-3)",
                                display: "flex",
                                gap: "var(--space-2)",
                                flexWrap: "wrap",
                              }}
                            >
                              {item.skills.map((skill) => (
                                <span
                                  className="badge badge-success"
                                  key={`${item.title}-${skill}`}
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        {item.projectUrl && (
                          <a
                            href={item.projectUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary"
                          >
                            Visit Project
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-light">No portfolio projects added.</p>
                )}
              </div>
            </>
          )}

          <div>
            <h2 style={{ marginBottom: "var(--space-6)" }}>
              Completed Projects
            </h2>

            {completedJobs.length > 0 ? (
              <div className="cards-list">
                {completedJobs.map((job) => (
                  <div key={job._id}>
                    <JobCard
                      job={job}
                      variant="default"
                      onViewDetails={handleViewDetails}
                    />
                    {job.review && (
                      <div
                        className="card"
                        style={{
                          marginTop: "var(--space-3)",
                          backgroundColor: "var(--color-bg-secondary)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: "var(--font-weight-medium)",
                                marginBottom: "var(--space-2)",
                              }}
                            >
                              Client Review
                            </div>
                            <p className="text-light">"{job.review.comment}"</p>
                          </div>
                          <div
                            style={{
                              fontSize: "var(--text-xl)",
                              color: "var(--color-warning)",
                            }}
                          >
                            {"*".repeat(job.review.rating)}
                            <span style={{ color: "var(--color-border)" }}>
                              {"*".repeat(5 - job.review.rating)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="card"
                style={{
                  textAlign: "center",
                  padding: "var(--space-8)",
                }}
              >
                <EmptyState
                  title="No Completed Projects"
                  description="Projects you complete will appear here with their reviews."
                />
              </div>
            )}
          </div>

          <div style={{ marginTop: "var(--space-12)" }}>
            <div
              className="card"
              style={{
                border: "1px solid var(--color-error)",
              }}
            >
              <h3
                style={{
                  marginBottom: "var(--space-2)",
                  color: "var(--color-error)",
                }}
              >
                Danger Zone
              </h3>
              <p
                className="text-light"
                style={{ marginBottom: "var(--space-4)" }}
              >
                Once you deactivate your account, you will not be able to log in
                or access your profile. Your data will be permanently deleted.
              </p>
              {deleteEligibility?.canDelete ? (
                <button
                  type="button"
                  className="btn"
                  style={{
                    backgroundColor: "var(--color-error)",
                    color: "white",
                  }}
                  onClick={() => setShowDeactivateModal(true)}
                >
                  Delete Account
                </button>
              ) : (
                <div>
                  <p
                    className="text-light"
                    style={{
                      color: "var(--color-error)",
                      marginBottom: "var(--space-3)",
                    }}
                  >
                    You cannot delete your account right now due to the
                    following:
                  </p>
                  <ul
                    style={{
                      marginLeft: "var(--space-4)",
                      marginBottom: "var(--space-3)",
                    }}
                  >
                    {(deleteEligibility?.reasons?.length
                      ? deleteEligibility.reasons
                      : [
                          {
                            type: "unknown",
                            message:
                              "You have active commitments that must be resolved before deleting your account.",
                          },
                        ]
                    ).map((reason) => (
                      <li key={reason.type} className="text-light">
                        {reason.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedJob && (
        <JobModal
          job={selectedJob}
          mode="view"
          onClose={handleCloseModal}
          onSubmitMilestone={handleSubmitMilestone}
          onApproveMilestone={handleApproveMilestone}
          loading={isSubmittingMilestone || isApprovingMilestone}
          currentUser={user}
        />
      )}

      {showDeactivateModal && (
        <div
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget && !isDeactivating) {
              setShowDeactivateModal(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !isDeactivating) {
              setShowDeactivateModal(false);
            }
          }}
        >
          <div className="card" style={{ maxWidth: "400px", width: "90%" }}>
            <h3 style={{ marginBottom: "var(--space-4)" }}>Delete Account?</h3>
            {deleteEligibility?.canDelete ? (
              <p
                className="text-light"
                style={{ marginBottom: "var(--space-6)" }}
              >
                Are you sure you want to delete your account? This action cannot
                be undone. You will be logged out immediately.
              </p>
            ) : (
              <div style={{ marginBottom: "var(--space-6)" }}>
                <p
                  className="text-light"
                  style={{
                    color: "var(--color-error)",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  You cannot delete your account right now due to the following:
                </p>
                <ul style={{ marginLeft: "var(--space-4)" }}>
                  {deleteEligibility?.reasons?.map((reason) => (
                    <li key={reason.type} className="text-light">
                      {reason.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {deactivateError && (
              <div
                className="card-error"
                style={{ marginBottom: "var(--space-4)" }}
              >
                {deactivateError}
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: "var(--space-3)",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeactivateModal(false)}
                disabled={isDeactivating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  backgroundColor: "var(--color-error)",
                  color: "white",
                }}
                onClick={handleDeactivateAccount}
                disabled={isDeactivating || !deleteEligibility?.canDelete}
              >
                {isDeactivating ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
