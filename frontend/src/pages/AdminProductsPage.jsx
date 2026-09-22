import { useState } from "react";
import { useAuth } from "@clerk/react";
import { PencilIcon, PlusIcon, SettingsIcon, Trash2Icon } from "lucide-react";
import { useAdminProducts } from "../hooks/useAdminProducts";
import { useAdminCategories } from "../hooks/useAdminCategories";
import { AdminProductFormModal } from "../components/AdminProductFormModal";
import { AdminProductsTableSkeleton } from "../components/LoadingSkeletons";
import PageError from "../components/PageError";
import { SearchInput } from "../components/SearchInput";
import { uploadProductImage } from "../lib/imagekitUpload";
import { IK_PRESETS, imageKitOptimizedUrl } from "../lib/imagekitUrl";
import { formatPrice } from "../utils/format";

function AdminProductsPage() {
  const { getToken } = useAuth();
  const [q, setQ] = useState("");
  const {
    products,
    isLoading,
    isError,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useAdminProducts({ q });

  const { categories, createCategory } = useAdminCategories();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteErrorId, setDeleteErrorId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function openCreate() {
    setEditingProduct(null);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditingProduct(product);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    setFormError("");
    try {
      let imageUrl = editingProduct?.imageUrl ?? null;
      let imageKitFileId = editingProduct?.imageKitFileId ?? null;

      if (values.imageFile) {
        const uploaded = await uploadProductImage(values.imageFile, getToken);
        imageUrl = uploaded.url;
        imageKitFileId = uploaded.fileId;
      }

      const body = {
        name: values.name,
        slug: values.slug,
        category: values.category,
        description: values.description,
        pricePounds: values.pricePounds,
        currency: "egp",
        active: values.active,
        imageUrl,
        imageKitFileId,
      };

      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...body });
      } else {
        await createProduct.mutateAsync(body);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(product) {
    await updateProduct.mutateAsync({
      id: product.id,
      active: !product.active,
    });
  }

  async function confirmAndDelete() {
    const product = confirmDelete;
    if (!product) return;
    setDeleteErrorId(null);
    try {
      await deleteProduct.mutateAsync(product.id);
    } catch {
      setDeleteErrorId(product.id);
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div className="text-left">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-base-content">
          <SettingsIcon className="size-8 text-primary" aria-hidden />
          Manage products
        </h1>
        <div className="flex flex-wrap gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search products…" className="w-64" />
          <button
            type="button"
            className="btn btn-primary gap-2 shadow-md"
            onClick={openCreate}
          >
            <PlusIcon className="size-4" aria-hidden />
            New product
          </button>
        </div>
      </div>

      {isLoading ? (
        <AdminProductsTableSkeleton />
      ) : isError ? (
        <PageError message="We couldn't load products." />
      ) : products.length === 0 ? (
        <div className="rounded-box border border-dashed border-base-300 bg-base-100 py-16 text-center text-base-content/60">
          No products match.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
          <table className="table">
            <thead>
              <tr>
                <th className="w-24">Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Active</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="mx-auto size-14 overflow-hidden rounded-xl bg-base-300 sm:size-18">
                      {product.imageUrl ? (
                        <img
                          src={imageKitOptimizedUrl(
                            product.imageUrl,
                            IK_PRESETS.adminThumb,
                          )}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <p className="font-medium text-base-content">
                      {product.name}
                    </p>
                    <p className="font-mono text-xs text-base-content/50">
                      {product.slug}
                    </p>
                  </td>
                  <td>{product.category}</td>
                  <td className="tabular-nums">
                    {formatPrice(product.pricePounds, product.currency)}
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary toggle-sm"
                      checked={product.active}
                      onChange={() => handleToggleActive(product)}
                      aria-label={
                        product.active ? "Deactivate" : "Activate"
                      }
                    />
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-square"
                        onClick={() => openEdit(product)}
                        aria-label="Edit"
                      >
                        <PencilIcon className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
                        onClick={() => setConfirmDelete(product)}
                        aria-label="Delete"
                      >
                        <Trash2Icon className="size-4" aria-hidden />
                      </button>
                    </div>
                    {deleteErrorId === product.id ? (
                      <p className="mt-1 text-right text-xs text-error">
                        Couldn't delete
                      </p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen ? (
        <AdminProductFormModal
          product={editingProduct}
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
            if (e.target === e.currentTarget) setConfirmDelete(null);
          }}
        >
          <div className="modal-box w-full max-w-sm">
            <h3 className="text-lg font-bold text-base-content">
              Delete product?
            </h3>
            <p className="mt-2 text-sm text-base-content/70">
              Delete "{confirmDelete.name}"? This can't be undone.
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={() => setConfirmDelete(null)}
              >
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

export default AdminProductsPage;
