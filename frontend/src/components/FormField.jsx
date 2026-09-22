// Shared, deliberately nicer-looking form controls — larger padding,
// rounded corners, a tinted background that lifts on focus, and a soft
// glow focus ring in the theme's primary color instead of daisyUI's default
// hard outline. Use these for any new form instead of bare input-bordered.
const CONTROL_CLASS =
  "w-full rounded-xl border-base-300 bg-base-200/40 px-4 py-3 transition-all duration-150 outline-none focus:border-primary focus:bg-base-100 focus:ring-4 focus:ring-primary/15";

function FieldLabel({ label, optional }) {
  if (!label) return null;
  return (
    <span className="label-text mb-1.5 text-sm font-medium text-base-content/80">
      {label}
      {optional ? <span className="text-base-content/40"> (optional)</span> : null}
    </span>
  );
}

export function TextField({ label, optional, className = "", ...inputProps }) {
  return (
    <label className="form-control">
      <FieldLabel label={label} optional={optional} />
      <input className={`input input-bordered ${CONTROL_CLASS} ${className}`} {...inputProps} />
    </label>
  );
}

export function TextAreaField({ label, optional, className = "", ...textareaProps }) {
  return (
    <label className="form-control">
      <FieldLabel label={label} optional={optional} />
      <textarea className={`textarea textarea-bordered ${CONTROL_CLASS} ${className}`} {...textareaProps} />
    </label>
  );
}

export function SelectField({ label, optional, className = "", children, ...selectProps }) {
  return (
    <label className="form-control">
      <FieldLabel label={label} optional={optional} />
      <select className={`select select-bordered ${CONTROL_CLASS} ${className}`} {...selectProps}>
        {children}
      </select>
    </label>
  );
}
