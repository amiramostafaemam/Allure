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

function StarRatingInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onFocus={() => setHovered(n)}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none! focus:[--input-color:var(--color-primary)]"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <StarIcon className={`size-6 ${n <= active ? "fill-warning text-warning" : "text-base-300"}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewerAvatar({ name, avatarUrl }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
      {(name || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

function ReviewForm({ createReview }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    createReview.mutate(
      { rating, comment: comment.trim() || undefined },
      { onSuccess: () => setComment("") },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-box border border-base-300 bg-base-100 p-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-base-content/80">Your rating</span>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>
      <textarea
        className="textarea w-full focus:[--input-color:var(--color-primary)] focus:outline-none!"
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
                <div className="flex items-center gap-2">
                  <ReviewerAvatar name={review.reviewerName} avatarUrl={review.reviewerAvatarUrl} />
                  <p className="font-medium text-base-content">{review.reviewerName || "Customer"}</p>
                </div>
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
