import { useState } from "react";
import { UsersIcon } from "lucide-react";
import { useAdminCustomers } from "../hooks/useAdminCustomers";
import { useMe } from "../hooks/useMe";
import { AdminTableSkeleton } from "../components/LoadingSkeletons";
import PageError from "../components/PageError";
import { formatOrderWhen } from "../utils/format";

const ROLES = ["customer", "support", "admin"];

function AdminCustomersPage() {
  const { customers, isLoading, isError, updateRole } = useAdminCustomers();
  const { me } = useMe();
  const [errorForId, setErrorForId] = useState(null);

  async function handleRoleChange(id, role) {
    setErrorForId(null);
    try {
      await updateRole.mutateAsync({ id, role });
    } catch {
      setErrorForId(id);
    }
  }

  if (isLoading) return <AdminTableSkeleton columns={5} />;
  if (isError) return <PageError message="We couldn't load customers." />;

  return (
    <div>
      <h1 className="mb-8 flex items-center gap-2 text-3xl font-bold text-base-content">
        <UsersIcon className="size-8 text-primary" aria-hidden />
        Customers
      </h1>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => {
              const isSelf = customer.id === me?.id;
              return (
                <tr key={customer.id}>
                  <td className="font-medium text-base-content">
                    {customer.displayName || "—"}
                  </td>
                  <td className="text-sm text-base-content/70">{customer.email}</td>
                  <td>
                    <span className="badge badge-sm capitalize">{customer.role}</span>
                  </td>
                  <td className="text-sm text-base-content/60">
                    {formatOrderWhen(customer.createdAt)}
                  </td>
                  <td>
                    <div className="flex flex-col items-end gap-1">
                      <select
                        className="select select-bordered select-xs"
                        value={customer.role}
                        disabled={isSelf || updateRole.isPending}
                        title={isSelf ? "You can't change your own role" : undefined}
                        onChange={(e) => handleRoleChange(customer.id, e.target.value)}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      {errorForId === customer.id ? (
                        <p className="text-xs text-error">Couldn't update role</p>
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

export default AdminCustomersPage;
