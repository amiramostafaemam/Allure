import { Link } from "react-router";
import { ArrowRightIcon, CompassIcon } from "lucide-react";

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-base-300 bg-linear-to-b from-base-200/50 to-base-100 px-6 py-16 text-center sm:px-10">
      <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-base-300/60 text-primary/80 ring-4 ring-base-200/80">
        <CompassIcon className="size-10" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-base-content">
        404 — page not found
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-base-content/65">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/" className="btn btn-primary mt-8 gap-2 shadow-md">
        Back to shop
        <ArrowRightIcon className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

export default NotFoundPage;
