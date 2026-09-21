import { useEffect, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

// Debounces free typing before calling onChange, and stays in sync when
// `value` changes externally (e.g. browser back/forward).
export function SearchInput({ value, onChange, placeholder = "Search…", className = "" }) {
  const [draft, setDraft] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const debounced = useDebouncedValue(draft, 300);

  // Adjusting our own state from props during render (React's recommended
  // pattern), separate from the effect below that notifies the parent.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <label className={`input input-bordered flex items-center gap-2 ${className}`}>
      <SearchIcon className="size-4 text-base-content/50" aria-hidden />
      <input
        type="search"
        className="grow"
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      {draft ? (
        <button
          type="button"
          className="text-base-content/40 hover:text-base-content"
          onClick={() => setDraft("")}
          aria-label="Clear search"
        >
          <XIcon className="size-4" aria-hidden />
        </button>
      ) : null}
    </label>
  );
}
