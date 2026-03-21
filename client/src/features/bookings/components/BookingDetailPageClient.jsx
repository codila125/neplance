"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  generateBookingVisitOtpAction,
  submitBookingQuoteAction,
  verifyBookingVisitOtpAction,
} from "@/lib/actions/bookings";
import { browserApiRequest } from "@/lib/api/browser";
import { CloudinaryFileUploader } from "@/shared/components/CloudinaryFileUploader";
import { BOOKING_STATUS } from "@/shared/constants/statuses";

const BOOKING_POLL_INTERVAL_MS = 4000;

export function BookingDetailPageClient({ booking, currentUserId }) {
  const [currentBooking, setCurrentBooking] = useState(booking);
  const [visitOtp, setVisitOtp] = useState("");
  const [quoteAmount, setQuoteAmount] = useState(
    currentBooking.quoteAmount ? String(currentBooking.quoteAmount) : "",
  );
  const [quoteNotes, setQuoteNotes] = useState(currentBooking.quoteNotes || "");
  const [quoteAttachments, setQuoteAttachments] = useState(
    Array.isArray(currentBooking.quoteAttachments)
      ? currentBooking.quoteAttachments
      : [],
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isClient =
    String(currentBooking.client?._id || currentBooking.client) ===
    String(currentUserId);
  const isFreelancer =
    String(currentBooking.freelancer?._id || currentBooking.freelancer) ===
    String(currentUserId);
  const visitVerified =
    currentBooking.visitVerification?.status === "VERIFIED" ||
    !currentBooking.requiresVisit;
  const canQuote =
    isFreelancer &&
    !currentBooking.contract &&
    (visitVerified ||
      currentBooking.status === BOOKING_STATUS.VISIT_VERIFIED ||
      !currentBooking.requiresVisit);
  const canGenerateVisitOtp =
    isClient &&
    currentBooking.requiresVisit &&
    !currentBooking.contract &&
    currentBooking.visitVerification?.status !== "VERIFIED";
  const canCreateContract =
    isClient &&
    currentBooking.status === BOOKING_STATUS.QUOTED &&
    !currentBooking.contract;

  useEffect(() => {
    setQuoteAmount(
      currentBooking.quoteAmount ? String(currentBooking.quoteAmount) : "",
    );
    setQuoteNotes(currentBooking.quoteNotes || "");
    setQuoteAttachments(
      Array.isArray(currentBooking.quoteAttachments)
        ? currentBooking.quoteAttachments
        : [],
    );
  }, [
    currentBooking.quoteAmount,
    currentBooking.quoteAttachments,
    currentBooking.quoteNotes,
  ]);

  useEffect(() => {
    let isMounted = true;

    const syncBooking = async () => {
      try {
        const response = await browserApiRequest(
          `/api/bookings/${currentBooking._id}`,
          {
            method: "GET",
          },
        );

        if (!response.ok) {
          return;
        }

        if (isMounted && response.data?.data) {
          setCurrentBooking(response.data.data);
        }
      } catch {
        // Keep current UI state if polling fails.
      }
    };

    const intervalId = window.setInterval(
      syncBooking,
      BOOKING_POLL_INTERVAL_MS,
    );
    window.addEventListener("focus", syncBooking);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncBooking();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncBooking);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentBooking._id]);

  const runAction = (work) => {
    setError("");
    startTransition(async () => {
      try {
        const result = await work();
        setCurrentBooking(result.data);
      } catch (actionError) {
        setError(actionError.message || "Something went wrong.");
      }
    });
  };

  return (
    <div className="section section-sm">
      <div className="container max-w-3xl">
        <div className="card">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <h1 className="mb-2">Physical Booking</h1>
              <p className="text-muted mb-0">
                {currentBooking.job?.title || "Booking"} for{" "}
                {currentBooking.freelancer?.name ||
                  currentBooking.freelancer?.email ||
                  "selected freelancer"}
              </p>
            </div>
            <span className="badge badge-primary">{currentBooking.status}</span>
          </div>

          <div className="grid gap-4 mb-6">
            <div>
              <strong>Job category:</strong>{" "}
              {currentBooking.job?.category || "N/A"}
            </div>
            <div>
              <strong>Client:</strong>{" "}
              {currentBooking.client?.name || currentBooking.client?.email}
            </div>
            <div>
              <strong>Freelancer:</strong>{" "}
              {currentBooking.freelancer?.name ||
                currentBooking.freelancer?.email}
            </div>
            <div>
              <strong>Visit required:</strong>{" "}
              {currentBooking.requiresVisit ? "Yes" : "No"}
            </div>
            {currentBooking.scheduledFor ? (
              <div>
                <strong>Scheduled visit:</strong>{" "}
                {new Date(currentBooking.scheduledFor).toLocaleDateString(
                  "en-NP",
                )}
              </div>
            ) : null}
            {currentBooking.job?.location ? (
              <div>
                <strong>Location:</strong>{" "}
                {[
                  currentBooking.job.location.address,
                  currentBooking.job.location.city,
                  currentBooking.job.location.district,
                  currentBooking.job.location.province,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            ) : null}
          </div>

          {currentBooking.notes ? (
            <div className="mb-6">
              <h3 className="mb-2">Booking Notes</h3>
              <p className="text-muted mb-0">{currentBooking.notes}</p>
            </div>
          ) : null}

          {currentBooking.requiresVisit ? (
            <div className="card-sm mb-6">
              <h3 className="mb-3">Visit Verification</h3>
              <p className="text-muted">
                Status: {currentBooking.visitVerification?.status || "PENDING"}
              </p>
              {canGenerateVisitOtp ? (
                <div className="flex gap-3 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={isPending}
                    onClick={() =>
                      runAction(() =>
                        generateBookingVisitOtpAction(currentBooking._id),
                      )
                    }
                  >
                    {isPending ? "Generating..." : "Generate Visit OTP"}
                  </button>
                  {currentBooking.visitVerification?.otpCode ? (
                    <span className="badge badge-warning">
                      OTP: {currentBooking.visitVerification.otpCode}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {isFreelancer &&
              currentBooking.visitVerification?.status !== "VERIFIED" &&
              !currentBooking.contract ? (
                <div style={{ marginTop: "var(--space-3)" }}>
                  <label className="form-label" htmlFor="booking-visit-otp">
                    Enter client OTP
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    <input
                      id="booking-visit-otp"
                      className="form-input"
                      value={visitOtp}
                      onChange={(event) => setVisitOtp(event.target.value)}
                      placeholder="6-digit OTP"
                      style={{ maxWidth: "220px" }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={isPending || !visitOtp.trim()}
                      onClick={() => {
                        runAction(() =>
                          verifyBookingVisitOtpAction(
                            currentBooking._id,
                            visitOtp,
                          ),
                        );
                        setVisitOtp("");
                      }}
                    >
                      {isPending ? "Verifying..." : "Verify Visit"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="card-sm mb-6">
            <h3 className="mb-3">Freelancer Quote</h3>
            {currentBooking.quoteAmount ? (
              <p className="text-muted">
                Final quoted amount: NPR{" "}
                {Number(currentBooking.quoteAmount).toLocaleString()}
              </p>
            ) : (
              <p className="text-muted">
                The freelancer will submit the final amount here after
                inspection or real-time assessment.
              </p>
            )}

            {canQuote ? (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="booking-quote-amount">
                    Final amount (NPR)
                  </label>
                  <input
                    id="booking-quote-amount"
                    className="form-input"
                    type="number"
                    min="0"
                    value={quoteAmount}
                    onChange={(event) => setQuoteAmount(event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="booking-quote-notes">
                    Scope after inspection
                  </label>
                  <textarea
                    id="booking-quote-notes"
                    className="form-input"
                    rows={4}
                    value={quoteNotes}
                    onChange={(event) => setQuoteNotes(event.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <CloudinaryFileUploader
                    buttonLabel="Upload Quote Attachment"
                    folder="booking-quotes"
                    disabled={isPending}
                    onUploaded={(upload) =>
                      setQuoteAttachments((previous) => [...previous, upload])
                    }
                  />
                  {quoteAttachments.length > 0 ? (
                    <div
                      style={{
                        display: "grid",
                        gap: "var(--space-3)",
                        marginTop: "var(--space-3)",
                      }}
                    >
                      {quoteAttachments.map((attachment, index) => (
                        <div key={attachment.url || index} className="card-sm">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <span>
                              {attachment.name || `Attachment ${index + 1}`}
                            </span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() =>
                                setQuoteAttachments((previous) =>
                                  previous.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  ),
                                )
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isPending || Number(quoteAmount) <= 0}
                  onClick={() =>
                    runAction(() =>
                      submitBookingQuoteAction(
                        currentBooking._id,
                        quoteAmount,
                        quoteNotes,
                        quoteAttachments,
                      ),
                    )
                  }
                >
                  {isPending
                    ? "Saving..."
                    : currentBooking.quoteAmount
                      ? "Update Quote"
                      : "Submit Final Quote"}
                </button>
              </>
            ) : null}

            {currentBooking.quoteNotes ? (
              <p className="text-muted" style={{ marginTop: "var(--space-3)" }}>
                {currentBooking.quoteNotes}
              </p>
            ) : null}
          </div>

          {error ? <div className="card-error mb-4">{error}</div> : null}

          <div className="flex gap-3 flex-wrap">
            <Link
              href={`/proposals/${currentBooking.proposal?._id || currentBooking.proposal}`}
              className="btn btn-ghost"
            >
              View Proposal
            </Link>
            <Link
              href={`/jobs/${currentBooking.job?._id || currentBooking.job}`}
              className="btn btn-ghost"
            >
              View Job
            </Link>
            {canCreateContract ? (
              <Link
                href={`/contracts/create?bookingId=${currentBooking._id}`}
                className="btn btn-primary"
              >
                Create Contract
              </Link>
            ) : null}
            {currentBooking.contract?._id || currentBooking.contract ? (
              <Link
                href={`/contracts/${currentBooking.contract?._id || currentBooking.contract}`}
                className="btn btn-secondary"
              >
                Open Contract
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
