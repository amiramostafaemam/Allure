import { useEffect, useState } from "react";
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
      imageFile,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box w-full max-w-lg">
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

          <div className="grid gap-4 sm:grid-cols-2">
            {creatingCategory ? (
              <div className="form-control">
                <span className="label-text mb-1.5 text-sm font-medium text-base-content/80">
                  New category
                </span>
                <div className="flex gap-2">
                  <TextField
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1"
                  />
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
                {categoryError ? <p className="mt-1 text-xs text-error">{categoryError}</p> : null}
              </div>
            ) : (
              <SelectField
                label="Category"
                required
                value={form.category}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setCreatingCategory(true);
                    return;
                  }
                  setForm((f) => ({ ...f, category: e.target.value }));
                }}
              >
                <option value="" disabled>
                  Select a category…
                </option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                {onCreateCategory ? (
                  <option value="__new__">+ Create new category…</option>
                ) : null}
              </SelectField>
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
          </div>

          <TextAreaField
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />

          <label className="form-control">
            <span className="label-text mb-1">Image</span>
            <input
              type="file"
              accept="image/*"
              className="file-input file-input-bordered w-full"
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

          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={form.active}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
            />
            <span className="label-text">Active (visible in catalog)</span>
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
