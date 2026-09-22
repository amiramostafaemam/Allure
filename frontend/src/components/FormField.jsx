// Shared form controls. daisyUI 5 dropped `form-control`/`label-text`/
// `*-bordered` entirely (its `.input`/`.select`/`.textarea` are bordered by
// default, and `.label` is now an inline row for prefix/suffix content, not
// a block label-above-input wrapper) — those class names are silently inert
// in this app's daisyUI version, which is why spacing here used to rely on
// unstyled default flow instead of a real layout. Plain flex classes below
// instead. Focus color hooks into daisyUI's own --input-color variable
// (consumed by its built-in outline/box-shadow) rather than layering a
// second custom ring on top of it, which was doubling up visibly.
const CONTROL_CLASS =
  "w-full rounded-xl px-4 py-3 transition-colors duration-150 focus:[--input-color:var(--color-primary)]";

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

export function SelectField({ label, optional, className = "", children, ...selectProps }) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel label={label} optional={optional} />
      <select className={`select ${CONTROL_CLASS} ${className}`} {...selectProps}>
        {children}
      </select>
    </label>
  );
}
