"use client";

import React from "react";
import type { AdminUser } from "../../../dashboard/page";

type Props = {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  onSelectUser: (user: AdminUser) => void;
};

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

const UsersTable: React.FC<Props> = ({
  users,
  loading,
  error,
  onSelectUser,
}) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-sky-100 bg-white px-5 py-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading logged-in users…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 shadow-sm">
        <p className="text-sm font-medium text-red-700">
          Failed to load users
        </p>
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="rounded-2xl border border-sky-100 bg-white px-5 py-6 shadow-sm text-center text-sm text-slate-500">
        No logged-in users match the current filters.
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-sky-100 bg-white shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-sky-50 via-teal-50 to-emerald-50 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Logged-in Users
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-100">
              <th className="px-4 py-2 font-medium text-slate-600">Name</th>
              <th className="px-4 py-2 font-medium text-slate-600">Email</th>
              <th className="px-4 py-2 font-medium text-slate-600">Role</th>
              <th className="px-4 py-2 font-medium text-slate-600">
                Login Count
              </th>
              <th className="px-4 py-2 font-medium text-slate-600">
                Last Login
              </th>
              <th className="px-4 py-2 font-medium text-slate-600">
                Created At
              </th>
              <th className="px-4 py-2 font-medium text-slate-600">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u._id}
                className="border-t border-slate-100 hover:bg-sky-50/50"
              >
                <td className="px-4 py-2 text-slate-800">
                  {u.name || "—"}
                </td>
                <td className="px-4 py-2 text-slate-700">
                  <span className="text-xs font-mono bg-slate-50 px-2 py-1 rounded-full">
                    {u.email}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      u.role === "admin"
                        ? "bg-gradient-to-r from-sky-500 to-teal-500 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {u.role === "admin" ? "Admin" : "User"}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-800">
                  {u.loginCount ?? 0}
                </td>
                <td className="px-4 py-2 text-slate-800">
                  {formatDate(u.lastLogin)}
                </td>
                <td className="px-4 py-2 text-slate-800">
                  {formatDate(u.createdAt)}
                </td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => onSelectUser(u)}
                    className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-sky-600 hover:to-emerald-600"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default UsersTable;
