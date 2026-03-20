"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EmptyState } from "@/features/dashboard/components/EmptyState";
import { JobCard } from "@/features/dashboard/components/JobCard";
import { deleteJobAction, publishJobAction } from "@/lib/actions/jobs";
import { ActionModal } from "@/shared/components/ActionModal";
import { JOB_STATUS } from "@/shared/constants/statuses";

export function ClientJobsSection({ initialContracts, initialUser }) {
  const router = useRouter();
  const [contracts, setContracts] = useState(initialContracts);
  const [, startMutationTransition] = useTransition();
  const [jobAction, setJobAction] = useState(null);
  const [modalState, setModalState] = useState({
    open: false,
    title: "Confirm",
    message: "",
    hideCancel: false,
  });
  const [modalIntent, setModalIntent] = useState("info");

  const handleConfirmAction = async () => {
    if (modalIntent !== "job-action" || !jobAction) {
      setModalState((previous) => ({ ...previous, open: false }));
      return;
    }
    startMutationTransition(async () => {
      try {
        if (jobAction.type === "publish") {
          const result = await publishJobAction(jobAction.job._id);
          setContracts((prev) =>
            prev.map((contract) =>
              contract._id === result.data._id ? result.data : contract,
            ),
          );
        }
        if (jobAction.type === "delete") {
          await deleteJobAction(jobAction.job._id);
          setContracts((prev) =>
            prev.filter((contract) => contract._id !== jobAction.job._id),
          );
        }
        setJobAction(null);
        setModalState((previous) => ({ ...previous, open: false }));
        router.refresh();
      } catch (err) {
        setModalIntent("info");
        setModalState({
          open: true,
          title: "Notice",
          message:
            err?.message ||
            (jobAction.type === "publish"
              ? "Failed to post job"
              : "Failed to delete job"),
          hideCancel: true,
        });
      }
    });
  };

  const handlePostDraftJob = async (job) => {
    setJobAction({ type: "publish", job });
    setModalIntent("job-action");
    setModalState({
      open: true,
      title: "Confirm",
      message: "Are you sure you want to post this job?",
      hideCancel: false,
    });
  };

  const handleDeleteJob = async (job) => {
    const confirmMessage =
      job.status === JOB_STATUS.DRAFT
        ? "Are you sure you want to delete this draft?"
        : "Are you sure you want to delete this job? This action cannot be undone.";
    setJobAction({ type: "delete", job });
    setModalIntent("job-action");
    setModalState({
      open: true,
      title: "Confirm",
      message: confirmMessage,
      hideCancel: false,
    });
  };

  const handleEditJob = (job) => {
    router.push(`/jobs/${job._id}/edit`);
  };

  return (
    <>
      <div className="cards-list">
        {contracts.length > 0 ? (
          contracts.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              variant="default"
              onPostJob={handlePostDraftJob}
              onDeleteJob={handleDeleteJob}
              onEditJob={handleEditJob}
              currentUser={initialUser}
            />
          ))
        ) : (
          <EmptyState
            title="No Jobs Yet"
            description="Post a job to start receiving proposals."
          />
        )}
      </div>
      <ActionModal
        open={modalState.open}
        title={modalState.title}
        message={modalState.message}
        confirmLabel="OK"
        cancelLabel="Cancel"
        hideCancel={modalState.hideCancel}
        onConfirm={handleConfirmAction}
        onClose={() => {
          setJobAction(null);
          setModalIntent("info");
          setModalState((previous) => ({ ...previous, open: false }));
        }}
      />
    </>
  );
}
