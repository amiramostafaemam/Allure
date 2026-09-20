import { useEffect, useState } from "react";
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl";
import { slugify } from "../utils/slugify";

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
}) {
  const [form, setForm] = useState(() => formFromProduct(product));
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.imageUrl ?? "");

  function handleNameChange(e) {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
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
          <label className="form-control">
            <span className="label-text mb-1">Name</span>
            <input
              type="text"
              required
              className="input input-bordered w-full"
              value={form.name}
              onChange={handleNameChange}
            />
          </label>

          <label className="form-control">
            <span className="label-text mb-1">Slug</span>
            <input
              type="text"
              required
              className="input input-bordered w-full font-mono text-sm"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: e.target.value }));
              }}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-control">
              <span className="label-text mb-1">Category</span>
              <select
                required
                className="select select-bordered w-full"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                <option value="" disabled>
                  Select a category…
                </option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text mb-1">Price (EGP)</span>
              <input
                type="number"
                min="1"
                step="1"
                required
                className="input input-bordered w-full"
                value={form.pricePounds}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pricePounds: e.target.value }))
                }
              />
            </label>
          </div>

          <label className="form-control">
            <span className="label-text mb-1">Description</span>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </label>

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
