import { formatContractDateTime } from "./contractDetailUtils";

export function ContractReviewsSection({
  canReview,
  handleSubmitReview,
  isPending,
  onReviewCommentChange,
  onReviewRatingChange,
  reviewComment,
  reviewRating,
  reviews,
}) {
  return (
    <>
      <div className="mb-6">
        <h3 className="mb-3">Reviews</h3>
        {reviews.length > 0 ? (
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {reviews.map((review) => (
              <div key={review._id} className="card-sm">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "var(--space-3)",
                    flexWrap: "wrap",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  <div>
                    <strong>{review.reviewer?.name || "Reviewer"}</strong>
                    <div className="text-sm text-muted">
                      {formatContractDateTime(review.createdAt)}
                    </div>
                  </div>
                  <span className="badge badge-primary">{review.rating}/5</span>
                </div>
                <p className="text-secondary mb-0">
                  {review.comment || "No written feedback provided."}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted mb-0">
            No reviews have been submitted for this contract yet.
          </p>
        )}
      </div>

      {canReview ? (
        <div className="mb-6">
          <h3 className="mb-3">Leave a Review</h3>
          <div className="card-sm">
            <div className="form-group">
              <label className="form-label" htmlFor="contract-review-rating">
                Rating
              </label>
              <select
                id="contract-review-rating"
                className="form-input"
                value={reviewRating}
                onChange={(event) => onReviewRatingChange(event.target.value)}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={String(value)}>
                    {value} / 5
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="contract-review-comment">
                Comment
              </label>
              <textarea
                id="contract-review-comment"
                className="form-input"
                rows={4}
                maxLength={2000}
                placeholder="Share your experience working on this contract"
                value={reviewComment}
                onChange={(event) => onReviewCommentChange(event.target.value)}
              />
            </div>
            <div className="flex justify-end mt-3">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSubmitReview}
                disabled={isPending}
              >
                {isPending ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
