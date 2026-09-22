import { useState } from "react";
import { CheckIcon, PencilIcon, PlusIcon, ShapesIcon, Trash2Icon, XIcon } from "lucide-react";
import { useAdminCategories } from "../hooks/useAdminCategories";
import { AdminTableSkeleton } from "../components/LoadingSkeletons";
import PageError from "../components/PageError";

function AdminCategoriesPage() {
  const { categories, isLoading, isError, createCategory, renameCategory, deleteCategory } =
    useAdminCategories();

  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [rowError, setRowError] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError("");
    const name = newName.trim();
    if (!name) return;
    try {
      await createCategory.mutateAsync(name);
      setNewName("");
    } catch (err) {
      setCreateError(err.message || "Couldn't create category.");
    }
  }

  function startEdit(category) {
    setEditingId(category.id);
    setEditValue(category.name);
    setRowError(null);
  }

  async function saveEdit(id) {
    const name = editValue.trim();
    if (!name) return;
    setRowError(null);
    try {
      await renameCategory.mutateAsync({ id, name });
      setEditingId(null);
    } catch (err) {
      setRowError({ id, message: err.message || "Couldn't rename category." });
    }
  }

  async function handleDelete(category) {
    setRowError(null);
    try {
      await deleteCategory.mutateAsync(category.id);
    } catch (err) {
      setRowError({ id: category.id, message: err.message || "Couldn't delete category." });
    }
  }

  if (isLoading) return <AdminTableSkeleton columns={3} />;
  if (isError) return <PageError message="We couldn't load categories." />;

  return (
    <div>
      <h1 className="mb-8 flex items-center gap-2 text-3xl font-bold text-base-content">
        <ShapesIcon className="size-8 text-primary" aria-hidden />
        Categories
      </h1>

      <form onSubmit={handleCreate} className="mb-6 flex flex-wrap items-start gap-3">
        <input
          type="text"
          placeholder="New category name"
          className="input"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="btn btn-primary gap-2" disabled={createCategory.isPending}>
          <PlusIcon className="size-4" aria-hidden />
          Add category
        </button>
        {createError ? <p className="w-full text-sm text-error">{createError}</p> : null}
      </form>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Products</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const isEditing = editingId === category.id;
              return (
                <tr key={category.id}>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        autoFocus
                        className="input input-sm"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                    ) : (
                      <span className="font-medium text-base-content">{category.name}</span>
                    )}
                  </td>
                  <td className="tabular-nums">{category.productCount}</td>
                  <td>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm btn-square"
                              onClick={() => saveEdit(category.id)}
                              disabled={renameCategory.isPending}
                              aria-label="Save"
                            >
                              <CheckIcon className="size-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm btn-square"
                              onClick={() => setEditingId(null)}
                              aria-label="Cancel"
                            >
                              <XIcon className="size-4" aria-hidden />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm btn-square"
                              onClick={() => startEdit(category)}
                              aria-label="Rename"
                            >
                              <PencilIcon className="size-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
                              onClick={() => handleDelete(category)}
                              disabled={deleteCategory.isPending}
                              aria-label="Delete"
                            >
                              <Trash2Icon className="size-4" aria-hidden />
                            </button>
                          </>
                        )}
                      </div>
                      {rowError?.id === category.id ? (
                        <p className="text-xs text-error">{rowError.message}</p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminCategoriesPage;
