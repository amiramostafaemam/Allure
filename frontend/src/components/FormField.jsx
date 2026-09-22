import { useEffect, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

// Shared form controls. daisyUI 5 dropped `form-control`/`label-text`/
// `*-bordered` entirely (its `.input`/`.select`/`.textarea` are bordered by
// default, and `.label` is now an inline row for prefix/suffix content, not
// a block label-above-input wrapper) — those class names are silently inert
// in this app's daisyUI version, which is why spacing here used to rely on
// unstyled default flow instead of a real layout. Plain flex classes below
// instead.
//
// Focus color hooks into daisyUI's own --input-color variable (consumed by
// its built-in border color), but daisyUI *also* draws a second, separate
// line on focus — a 2px outline offset 2px out from the border — as its own
// built-in emphasis treatment. That's the actual "double line": one field,
// two rings, by daisyUI's own design. `outline-none!` forces that second
// line off (Tailwind v4's important suffix — needed because daisyUI's own
// focus rule and a plain `outline-none` land at equal specificity, so the
// later one only wins with `!important`), leaving just the single colored
// border.
const CONTROL_CLASS =
  "w-full rounded-xl px-4 py-3 transition-colors duration-150 focus:[--input-color:var(--color-primary)] focus:outline-none!";

function FieldLabel({ label, optional }) {
  if (!label) return null;
  return (
    <span className="text-sm font-medium text-base-content/80">
      {label}
      {optional ? <span className="text-base-content/40"> (optional)</span> : null}
    </span>
  );
}

export function TextField({ label, optional, className = "", ...inputProps }) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel label={label} optional={optional} />
      <input className={`input ${CONTROL_CLASS} ${className}`} {...inputProps} />
    </label>
  );
}

export function TextAreaField({ label, optional, className = "", ...textareaProps }) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel label={label} optional={optional} />
      <textarea className={`textarea ${CONTROL_CLASS} ${className}`} {...textareaProps} />
    </label>
  );
}

// A native <select>'s open dropdown list is rendered by the OS/browser
// (most visibly on Windows Chromium), so it can never pick up the site's
// styling and reads as a jarring, unstyled popup dropped on top of an
// otherwise-styled trigger — the same class of problem as a native
// <input type="date">. This draws the whole thing ourselves instead: a
// styled trigger button plus our own absolutely-positioned option list.
export function SelectField({
  label,
  optional,
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  className = "",
}) {
  const [open, setOpen] = useState(false);
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

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative flex flex-col gap-1.5" ref={rootRef}>
      <FieldLabel label={label} optional={optional} />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`input flex items-center justify-between gap-2 text-left disabled:opacity-50 ${CONTROL_CLASS} ${className}`}
      >
        <span className={`truncate ${selected ? "text-base-content" : "text-base-content/40"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 opacity-60" aria-hidden />
      </button>

      {open ? (
        <ul className="absolute top-full z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-box border border-base-300 bg-base-100 p-1 shadow-lg">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                disabled={opt.disabled}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-base-200 disabled:text-base-content/40 disabled:hover:bg-transparent ${
                  opt.value === value ? "font-medium text-primary" : "text-base-content"
                }`}
              >
                {opt.label}
                {opt.value === value ? <CheckIcon className="size-4 shrink-0" aria-hidden /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
