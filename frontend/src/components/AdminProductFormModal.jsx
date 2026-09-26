import { useEffect, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl";
import { slugify } from "../utils/slugify";
import { SelectField, TextAreaField, TextField } from "./FormField";

function emptyForm() {
  return {
    name: "",
    slug: "",
    category: "",
    description: "",
    pricePounds: "",
    stockQuantity: "",
    active: true,
  };
}

function formFromProduct(product) {
  if (!product) return emptyForm();
  return {
    name: product.name,
    slug: product.slug,
    category: product.category ?? "",
    description: product.description ?? "",
    pricePounds: String(product.pricePounds ?? ""),
    stockQuantity: product.stockQuantity == null ? "" : String(product.stockQuantity),
    active: product.active,
  };
}

// Mounted only while open (see AdminProductsPage), so this initial state is
// computed fresh every time the modal opens — no effect needed to reset it.
export function AdminProductFormModal({
  product,
  categories = [],
  submitting,
  error,
  onClose,
  onSubmit,
  onCreateCategory,
}) {
  const [form, setForm] = useState(() => formFromProduct(product));
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.imageUrl ?? "");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);
  const [variantsEnabled, setVariantsEnabled] = useState(Boolean(product?.variantName));
  const [variantName, setVariantName] = useState(product?.variantName ?? "");
  const [variantRows, setVariantRows] = useState(() =>
    (product?.variants ?? []).map((v) => ({
      id: v.id,
      label: v.label,
      stockQuantity: v.stockQuantity == null ? "" : String(v.stockQuantity),
    })),
  );

  function addVariantRow() {
    setVariantRows((rows) => [...rows, { label: "", stockQuantity: "" }]);
  }

  function updateVariantRow(index, patch) {
    setVariantRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeVariantRow(index) {
    setVariantRows((rows) => rows.filter((_, i) => i !== index));
  }

  function handleNameChange(e) {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setCategorySaving(true);
    setCategoryError("");
    try {
      const category = await onCreateCategory(name);
      setForm((f) => ({ ...f, category: category.name }));
      setCreatingCategory(false);
      setNewCategoryName("");
    } catch (err) {
      setCategoryError(err.message || "Couldn't create category.");
    } finally {
      setCategorySaving(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
    }
  }

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      pricePounds: Number(form.pricePounds),
      stockQuantity: form.stockQuantity === "" ? null : Number(form.stockQuantity),
      imageFile,
      variantsEnabled,
      variantName: variantName.trim(),
      variantRows: variantRows
        .filter((r) => r.label.trim())
        .map((r) => ({
          ...(r.id ? { id: r.id } : {}),
          label: r.label.trim(),
          stockQuantity: r.stockQuantity === "" ? null : Number(r.stockQuantity),
        })),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box w-full max-w-xl max-h-[85vh] overflow-y-auto opacity-100! scale-100!">
        <h3 className="text-lg font-bold text-base-content">
          {product ? "Edit product" : "New product"}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <TextField
            label="Name"
            required
            value={form.name}
            onChange={handleNameChange}
          />

          <TextField
            label="Slug"
            required
            className="font-mono text-sm"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm((f) => ({ ...f, slug: e.target.value }));
            }}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {creatingCategory ? (
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-base-content/80">
                  New category
                </span>
                <div className="flex flex-wrap gap-2">
                  <TextField
                    autoFocus
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="min-w-0 flex-1"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={categorySaving || !newCategoryName.trim()}
                      onClick={handleCreateCategory}
                    >
                      {categorySaving ? "…" : "Add"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setCreatingCategory(false);
                        setCategoryError("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {categoryError ? <p className="mt-1 text-xs text-error">{categoryError}</p> : null}
              </div>
            ) : (
              <SelectField
                label="Category"
                placeholder="Select a category…"
                value={form.category}
                onChange={(value) => {
                  if (value === "__new__") {
                    setCreatingCategory(true);
                    return;
                  }
                  setForm((f) => ({ ...f, category: value }));
                }}
                options={[
                  ...categories.map((c) => ({ value: c, label: c })),
                  ...(onCreateCategory ? [{ value: "__new__", label: "+ Create new category…" }] : []),
                ]}
              />
            )}

            <TextField
              label="Price (EGP)"
              type="number"
              min="1"
              step="1"
              required
              value={form.pricePounds}
              onChange={(e) =>
                setForm((f) => ({ ...f, pricePounds: e.target.value }))
              }
            />

            <TextField
              label="Stock"
              optional
              type="number"
              min="0"
              step="1"
              placeholder="Leave blank for unlimited"
              value={form.stockQuantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, stockQuantity: e.target.value }))
              }
            />
          </div>

          <TextAreaField
            label="Description"
            optional
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />

          <div className="flex flex-col gap-3 rounded-xl border border-base-300 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={variantsEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setVariantsEnabled(enabled);
                  if (enabled && variantRows.length === 0) {
                    setVariantRows([{ label: "", stockQuantity: "" }]);
                  }
                }}
              />
              <span className="text-sm font-medium text-base-content/80">
                This product has options (size, color, …)
              </span>
            </label>

            {variantsEnabled ? (
              <div className="flex flex-col gap-3 pl-1">
                <TextField
                  label="Option name"
                  placeholder="e.g. Size, Color"
                  required
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                />

                <div className="flex flex-col gap-2">
                  {variantRows.map((row, i) => (
                    <div key={row.id ?? `new-${i}`} className="flex items-end gap-2">
                      <TextField
                        label={i === 0 ? "Label" : undefined}
                        placeholder="e.g. Black"
                        value={row.label}
                        onChange={(e) => updateVariantRow(i, { label: e.target.value })}
                        className="flex-1"
                      />
                      <TextField
                        label={i === 0 ? "Stock" : undefined}
                        optional
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Unlimited"
                        value={row.stockQuantity}
                        onChange={(e) => updateVariantRow(i, { stockQuantity: e.target.value })}
                        className="w-28"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariantRow(i)}
                        className="btn btn-ghost btn-square btn-sm text-error hover:bg-error/10"
                        aria-label="Remove option"
                      >
                        <Trash2Icon className="size-4" aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addVariantRow}
                  className="btn btn-ghost btn-sm w-fit gap-2 text-base-content/60"
                >
                  <PlusIcon className="size-3.5" aria-hidden />
                  Add option
                </button>
              </div>
            ) : null}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-base-content/80">Image</span>
            <input
              type="file"
              accept="image/*"
              className="file-input w-full"
              onChange={handleFileChange}
            />
            {imagePreview ? (
              <img
                src={imageKitOptimizedUrl(imagePreview, IK_PRESETS.formPreview)}
                alt=""
                className="mt-3 max-h-32 rounded-box border border-base-300 object-cover"
              />
            ) : null}
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={form.active}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
            />
            <span className="text-sm text-base-content/80">Active (visible in catalog)</span>
          </label>

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
