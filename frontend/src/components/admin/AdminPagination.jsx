import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

// Shared Prev/Next pagination bar for every admin list — page numbers would
// be overkill at the row counts a portfolio-scale admin panel actually
// sees; "Showing X-Y of Z" already tells you where you are.
export function AdminPagination({ page, limit, total, onPageChange }) {
  if (total <= limit) return null;

  const totalPages = Math.ceil(total / limit);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="mt-4 flex items-center justify-between gap-4 text-sm text-base-content/60">
      <span>
        Showing {from}–{to} of {total}
      </span>
      <div className="join">
        <button
          type="button"
          className="btn btn-sm join-item"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
        </button>
        <span className="btn btn-sm join-item pointer-events-none">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-sm join-item"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRightIcon className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
