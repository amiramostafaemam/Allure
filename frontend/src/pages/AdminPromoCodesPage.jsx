import { useState } from "react";
import { PlusIcon, TagIcon, Trash2Icon } from "lucide-react";
import { useAdminPromoCodes } from "../hooks/useAdminPromoCodes";
import { AdminTableSkeleton } from "../components/LoadingSkeletons";
import PageError from "../components/PageError";
import { TextField } from "../components/FormField";
import { formatOrderWhen } from "../utils/format";

function emptyForm() {
  return { code: "", percentOff: "10", expiresAt: "" };
}

function AdminPromoCodesPage() {
  const { promoCodes, isLoading, isError, createPromoCode, updatePromoCode, deletePromoCode } =
    useAdminPromoCodes();

  const [form, setForm] = useState(emptyForm);
  const [createError, setCreateError] = useState("");
  const [rowError, setRowError] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError("");
    const code = form.code.trim();
    const percentOff = Number(form.percentOff);
    if (!code || !Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100) return;

    try {
      await createPromoCode.mutateAsync({
        code,
        percentOff,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      });
      setForm(emptyForm());
    } catch (err) {
      setCreateError(err.message || "Couldn't create promo code.");
    }
  }

  async function handleToggleActive(promo) {
    setRowError(null);
    try {
      await updatePromoCode.mutateAsync({ id: promo.id, active: !promo.active });
    } catch (err) {
      setRowError({ id: promo.id, message: err.message || "Couldn't update." });
    }
  }

  async function handleDelete(promo) {
    setRowError(null);
    try {
      await deletePromoCode.mutateAsync(promo.id);
    } catch (err) {
      setRowError({ id: promo.id, message: err.message || "Couldn't delete." });
    }
  }

  if (isLoading) return <AdminTableSkeleton columns={5} />;
  if (isError) return <PageError message="We couldn't load promo codes." />;

  return (
    <div>
      <h1 className="mb-8 flex items-center gap-2 text-3xl font-bold text-base-content">
        <TagIcon className="size-8 text-primary" aria-hidden />
        Promo codes
      </h1>

      <form
        onSubmit={handleCreate}
        className="mb-6 grid gap-3 rounded-box border border-base-300 bg-base-100 p-4 sm:grid-cols-[1fr_140px_180px_auto]"
      >
        <TextField
          label="Code"
          placeholder="e.g. WELCOME10"
          className="uppercase"
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
        />
        <TextField
          label="% off"
          type="number"
          min="1"
          max="100"
          value={form.percentOff}
          onChange={(e) => setForm((f) => ({ ...f, percentOff: e.target.value }))}
        />
        <TextField
          label="Expires"
          optional
          type="date"
          value={form.expiresAt}
          onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
        />
        <div className="flex items-end">
          <button
            type="submit"
            className="btn btn-primary w-full gap-2"
            disabled={createPromoCode.isPending}
          >
            <PlusIcon className="size-4" aria-hidden />
            Add
          </button>
        </div>
        {createError ? <p className="sm:col-span-4 text-sm text-error">{createError}</p> : null}
      </form>

      {promoCodes.length === 0 ? (
        <div className="rounded-box border border-dashed border-base-300 bg-base-100 py-16 text-center text-base-content/60">
          No promo codes yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Expires</th>
                <th>Active</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((promo) => (
                <tr key={promo.id}>
                  <td className="font-mono font-medium text-base-content">{promo.code}</td>
                  <td>{promo.percentOff}% off</td>
                  <td className="text-sm text-base-content/60">
                    {promo.expiresAt ? formatOrderWhen(promo.expiresAt, { dateStyle: "medium" }) : "Never"}
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary toggle-sm"
                      checked={promo.active}
                      onChange={() => handleToggleActive(promo)}
                      aria-label={promo.active ? "Deactivate" : "Activate"}
                    />
                  </td>
                  <td>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
                        onClick={() => handleDelete(promo)}
                        disabled={deletePromoCode.isPending}
                        aria-label="Delete"
                      >
                        <Trash2Icon className="size-4" aria-hidden />
                      </button>
                      {rowError?.id === promo.id ? (
                        <p className="text-xs text-error">{rowError.message}</p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminPromoCodesPage;
