import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useNavigate, useParams, Link } from "react-router";
import { ArrowLeftIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useAdminCategories } from "../hooks/useAdminCategories";
import { useAdminProduct, useAdminProducts } from "../hooks/useAdminProducts";
import { AdminProductFormModal } from "../components/AdminProductFormModal";
import PageError from "../components/PageError";
import { uploadProductImage } from "../lib/imagekitUpload";
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl";
import { formatPrice } from "../utils/format";

function AdminProductDetailPage() {
  const { id } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { product, isLoading, isError } = useAdminProduct(id);
  const { categories, createCategory } = useAdminCategories();
  const { updateProduct, deleteProduct, saveVariants } = useAdminProducts();

  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  if (isLoading) {
    return <div className="skeleton h-96 w-full rounded-box" />;
  }
  if (isError || !product) {
    return <PageError message="We couldn't load this product." />;
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    setFormError("");
    try {
      let imageUrl = product.imageUrl ?? null;
      let imageKitFileId = product.imageKitFileId ?? null;

      if (values.imageFile) {
        const uploaded = await uploadProductImage(values.imageFile, getToken);
        imageUrl = uploaded.url;
        imageKitFileId = uploaded.fileId;
      }

      await updateProduct.mutateAsync({
        id: product.id,
        name: values.name,
        description: values.description,
        slug: values.slug,
        category: values.category,
        pricePounds: values.pricePounds,
        stockQuantity: values.stockQuantity,
        currency: "egp",
        active: values.active,
        imageUrl,
        imageKitFileId,
      });

      if (values.variantsEnabled || product.variantName) {
        await saveVariants.mutateAsync({
          productId: product.id,
          variantName: values.variantsEnabled ? values.variantName : null,
          variants: values.variantsEnabled ? values.variantRows : [],
        });
      }

      setModalOpen(false);
    } catch (err) {
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmAndDelete() {
    setDeleteError("");
    try {
      await deleteProduct.mutateAsync(product.id);
      navigate("/admin/products");
    } catch (err) {
      setDeleteError(err.message || "Couldn't delete this product.");
    }
  }

  const variants = product.variants ?? [];

  return (
    <div>
      <Link to="/admin/products" className="btn btn-ghost btn-sm mb-4 gap-2 px-2 text-base-content/70">
        <ArrowLeftIcon className="size-4 rtl:rotate-180" aria-hidden />
        Back to products
      </Link>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="relative h-64 overflow-hidden rounded-box border border-base-300 bg-base-300 sm:h-80 lg:h-112">
          {product.imageUrl ? (
            <>
              <img
                src={imageKitOptimizedUrl(product.imageUrl, IK_PRESETS.productHero)}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl"
              />
              <img
                src={imageKitOptimizedUrl(product.imageUrl, IK_PRESETS.productHero)}
                alt=""
                className="relative h-full w-full object-contain"
              />
            </>
          ) : null}
        </div>

        <div className="card border border-base-300 bg-base-100">
          <div className="card-body gap-4">
            <div>
              <h1 className="text-2xl font-bold text-base-content">{product.name}</h1>
              <p className="mt-1 font-mono text-xs text-base-content/50">{product.slug}</p>
            </div>

            <div className="flex gap-2">
              <button type="button" className="btn btn-sm flex-1 gap-2" onClick={() => setModalOpen(true)}>
                <PencilIcon className="size-4" aria-hidden />
                Edit
              </button>
              <button
                type="button"
                className="btn btn-sm flex-1 gap-2 text-error hover:bg-error/10"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2Icon className="size-4" aria-hidden />
                Delete
              </button>
            </div>

            <div className="divider my-0" />

            <div>
              <p className="text-xs uppercase tracking-wide text-base-content/50">Price</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-base-content">
                {formatPrice(product.pricePounds, product.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-base-content/50">Category</p>
              <p className="mt-1 font-semibold text-base-content">{product.category}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-base-content/50">Status</p>
              <span className={`badge badge-sm mt-1 border-0 ${product.active ? "badge-success" : "badge-neutral"}`}>
                {product.active ? "Active" : "Inactive"}
              </span>
            </div>
            {!product.variantName ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-base-content/50">Stock</p>
                <p className="mt-1 font-semibold tabular-nums text-base-content">
                  {product.stockQuantity == null ? "Unlimited" : product.stockQuantity}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100 lg:col-span-2">
          <div className="card-body">
            <h2 className="text-sm font-semibold text-base-content">Description</h2>
            <p className="mt-1 text-sm leading-relaxed text-base-content/70">
              {product.description || <span className="text-base-content/40">No description.</span>}
            </p>

            {product.variantName ? (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold text-base-content">
                  {product.variantName} options
                </h2>
                <div className="overflow-x-auto rounded-box border border-base-300">
                  <table className="table admin-table">
                    <thead>
                      <tr>
                        <th>{product.variantName}</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => (
                        <tr key={v.id}>
                          <td className="font-medium text-base-content">{v.label}</td>
                          <td className="tabular-nums">
                            {v.stockQuantity == null ? (
                              <span className="text-base-content/50">Unlimited</span>
                            ) : v.stockQuantity <= 0 ? (
                              <span className="badge badge-error badge-sm border-0">Out of stock</span>
                            ) : (
                              v.stockQuantity
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {modalOpen ? (
        <AdminProductFormModal
          product={product}
          categories={categories.map((c) => c.name)}
          submitting={submitting}
          error={formError}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          onCreateCategory={(name) =>
            createCategory.mutateAsync(name).then((res) => res.category)
          }
        />
      ) : null}

      {confirmDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDelete(false);
          }}
        >
          <div className="modal-box w-full max-w-sm opacity-100! scale-100!">
            <h3 className="text-lg font-bold text-base-content">Delete product?</h3>
            <p className="mt-2 text-sm text-base-content/70">
              Delete "{product.name}"? This can't be undone.
            </p>
            {deleteError ? <p className="mt-2 text-sm text-error">{deleteError}</p> : null}
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={confirmAndDelete}
                disabled={deleteProduct.isPending}
              >
                {deleteProduct.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminProductDetailPage;
