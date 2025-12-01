"use client";

import { useEffect, useState } from "react";
import UsersFilterBar from "../mba/components/users/UsersFilterBar";
import UsersTable from "../mba/components/users/UsersTable";
import UserDetailDrawer from "../mba/components/users/UserDetailDrawer";

export type UserNote = {
  text: string;
  createdAt: string; // ISO string from API
};

export type AdminUser = {
  _id: string;
  email: string;
  name?: string;
  image?: string | null;
  role: "admin" | "user";
  loginCount: number;
  lastLogin: string; // ISO
  createdAt: string; // ISO
  notes?: UserNote[];
};

type RoleFilter = "all" | "admin" | "user";

/**
 * Apply filters on the client side to a list of users.
 */
function applyFilters(
  users: AdminUser[],
  roleFilter: RoleFilter,
  dateFrom: string,
  dateTo: string,
  search: string
): AdminUser[] {
  return users.filter((user) => {
    // Role filter
    if (roleFilter !== "all" && user.role !== roleFilter) {
      return false;
    }

    // Date range filter on lastLogin
    if (dateFrom || dateTo) {
      const lastLoginDate = user.lastLogin ? new Date(user.lastLogin) : null;
      if (!lastLoginDate || Number.isNaN(lastLoginDate.getTime())) {
        return false;
      }

      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!Number.isNaN(from.getTime()) && lastLoginDate < from) {
          return false;
        }
      }

      if (dateTo) {
        const to = new Date(dateTo);
        if (!Number.isNaN(to.getTime())) {
          // include whole "to" day
          to.setHours(23, 59, 59, 999);
          if (lastLoginDate > to) {
            return false;
          }
        }
      }
    }

    // Search on name/email
    if (search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      const name = (user.name ?? "").toLowerCase();
      const email = (user.email ?? "").toLowerCase();
      if (!name.includes(q) && !email.includes(q)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Build query string from current filters – used only for CSV export now.
 */
function buildQueryString(
  roleFilter: RoleFilter,
  dateFrom: string,
  dateTo: string,
  search: string
): string {
  const params = new URLSearchParams();

  if (roleFilter !== "all") params.set("role", roleFilter);
  if (dateFrom) params.set("startDate", dateFrom);
  if (dateTo) params.set("endDate", dateTo);
  if (search.trim().length > 0) params.set("q", search.trim());

  return params.toString();
}

export default function AdminDashboardPage() {
  // 🔹 Raw data from API (loaded once)
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);

  // 🔹 Data actually shown in the table (after filters)
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Selected user drawer
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // ✅ Fetch ONCE on mount: get all logged-in users
  useEffect(() => {
    const controller = new AbortController();

    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/admin/users", {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch users (${res.status})`);
        }

        const data = await res.json();
        const list: AdminUser[] = Array.isArray(data)
          ? data
          : data.users ?? [];

        setAllUsers(list);
        // initial filtered list = all users
        setUsers(
          applyFilters(list, roleFilter, dateFrom, dateTo, search)
        );
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("[AdminDashboard] fetchUsers error:", err);
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
    return () => controller.abort();
    // empty dependency array → only once on mount
  }, []);

  // ✅ Whenever filters OR raw data change → recompute filtered list on client
  useEffect(() => {
    setUsers(applyFilters(allUsers, roleFilter, dateFrom, dateTo, search));
  }, [allUsers, roleFilter, dateFrom, dateTo, search]);

  const handleResetFilters = () => {
    setRoleFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  const handleExportCsv = async () => {
    try {
      const qs = buildQueryString(roleFilter, dateFrom, dateTo, search);
      const url = qs
        ? `/api/admin/users/export?${qs}`
        : "/api/admin/users/export";

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to export CSV (${res.status})`);
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "logged_in_users.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("[AdminDashboard] export CSV error:", err);
    }
  };

  const handleSelectUser = (user: AdminUser) => {
    setSelectedUser(user);
  };

  const handleNoteAdded = (userId: string, notes: UserNote[]) => {
    // Update drawer state
    setSelectedUser((prev) =>
      prev && prev._id === userId ? { ...prev, notes } : prev
    );
    // Update local lists
    setAllUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, notes } : u))
    );
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, notes } : u))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <header className="rounded-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 px-6 py-4 text-white shadow-md">
        <h1 className="text-2xl font-semibold tracking-tight">
          Admin Dashboard
        </h1>
      </header>

      {/* Filters bar */}
      <UsersFilterBar
        roleFilter={roleFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        search={search}
        onRoleChange={setRoleFilter}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onSearchChange={setSearch}
        onReset={handleResetFilters}
        onExport={handleExportCsv}
      />

      {/* Users table (uses filtered `users`) */}
      <UsersTable
        users={users}
        loading={loading}
        error={error}
        onSelectUser={handleSelectUser}
      />

      {/* User detail drawer */}
      <UserDetailDrawer
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onNoteAdded={handleNoteAdded}
      />
    </div>
  );
}
