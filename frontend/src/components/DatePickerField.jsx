import { useEffect, useRef, useState } from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

// Native <input type="date"> renders its calendar popup as an OS-level
// widget (Chromium on Windows in particular) that ignores author CSS
// entirely, so it can never pick up the site's theme/focus styling. This
// draws the whole picker ourselves from a plain "YYYY-MM-DD" string, using
// local Date fields (not toISOString, which shifts by timezone) so the
// selected day never drifts by one.
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromDateKey(key) {
  if (!key) return null;
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DatePickerField({ label, optional, value, onChange, placeholder = "Select date…" }) {
  const selected = fromDateKey(value);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selected ?? new Date());
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function openPicker() {
    setViewDate(selected ?? new Date());
    setOpen(true);
  }

  function pick(date) {
    onChange(toDateKey(date));
    setOpen(false);
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstOfMonth.getDay(); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="relative flex flex-col gap-1.5" ref={rootRef}>
      {label ? (
        <span className="text-sm font-medium text-base-content/80">
          {label}
          {optional ? <span className="text-base-content/40"> (optional)</span> : null}
        </span>
      ) : null}

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="input flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left transition-colors duration-150 focus:[--input-color:var(--color-primary)] focus:outline-none!"
      >
        <span className={selected ? "text-base-content" : "text-base-content/40"}>
          {selected ? toDateKey(selected) : placeholder}
        </span>
        <CalendarIcon className="size-4 shrink-0 opacity-60" aria-hidden />
      </button>

      {open ? (
        <div className="absolute top-full z-20 mt-2 w-72 rounded-box border border-base-300 bg-base-100 p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-square"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="size-4" aria-hidden />
            </button>
            <span className="text-sm font-semibold text-base-content">
              {MONTH_FORMAT.format(viewDate)}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-square"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              aria-label="Next month"
            >
              <ChevronRightIcon className="size-4" aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-base-content/50">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w} className="py-1">
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) =>
              date ? (
                <button
                  key={toDateKey(date)}
                  type="button"
                  onClick={() => pick(date)}
                  className={`btn btn-ghost btn-xs rounded-lg ${
                    isSameDay(date, selected)
                      ? "btn-primary"
                      : isSameDay(date, today)
                        ? "border border-primary/50"
                        : ""
                  }`}
                >
                  {date.getDate()}
                </button>
              ) : (
                <span key={`blank-${i}`} />
              ),
            )}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-base-300 pt-2">
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => pick(today)}>
              Today
            </button>
            {selected ? (
              <button
                type="button"
                className="btn btn-ghost btn-xs text-error"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
