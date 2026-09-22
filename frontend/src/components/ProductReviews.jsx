import { useState } from "react";
import { StarIcon } from "lucide-react";
import { useProductReviews } from "../hooks/useProductReviews";
import { formatOrderWhen } from "../utils/format";

function Stars({ value, className = "size-4" }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          className={`${className} ${n <= Math.round(value) ? "fill-warning text-warning" : "text-base-300"}`}
        />
      ))}
    </span>
  );
}

function ReviewForm({ createReview }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    createReview.mutate(
      { rating: Number(rating), comment: comment.trim() || undefined },
      { onSuccess: () => setComment("") },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-box border border-base-300 bg-base-100 p-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-base-content/80" htmlFor="review-rating">
          Your rating
        </label>
        <select
          id="review-rating"
          className="select select-sm w-24 focus:[--input-color:var(--color-primary)]"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className="textarea w-full focus:[--input-color:var(--color-primary)]"
        rows={3}
        placeholder="Share your experience with this product (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {createReview.isError ? (
        <p className="text-sm text-error">Couldn't submit your review. Try again.</p>
      ) : null}
      <button type="submit" className="btn btn-primary btn-sm" disabled={createReview.isPending}>
        {createReview.isPending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}

export function ProductReviews({ slug }) {
  const { reviews, averageRating, count, canReview, isLoading, createReview } = useProductReviews(slug);

  if (isLoading) return null;

  return (
    <section className="mt-16 border-t border-base-300 pt-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold uppercase tracking-wide text-base-content">Reviews</h2>
        {count > 0 ? (
          <div className="flex items-center gap-2">
            <Stars value={averageRating} className="size-5" />
            <span className="text-sm text-base-content/60">
              {averageRating.toFixed(1)} · {count} review{count > 1 ? "s" : ""}
            </span>
          </div>
        ) : null}
      </div>

      {canReview ? <ReviewForm createReview={createReview} /> : null}

      {reviews.length === 0 ? (
        <p className="mt-6 text-sm text-base-content/60">
          No reviews yet — be the first to share your experience.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-box border border-base-300 bg-base-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-base-content">{review.reviewerName || "Customer"}</p>
                <Stars value={review.rating} />
              </div>
              <p className="mt-1 text-xs text-base-content/50">{formatOrderWhen(review.createdAt)}</p>
              {review.comment ? (
                <p className="mt-2 text-sm text-base-content/70">{review.comment}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
