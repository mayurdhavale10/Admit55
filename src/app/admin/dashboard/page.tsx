"use client";

import { useEffect, useMemo, useState } from "react";
import UsersFilterBar from "../mba/components/users/UsersFilterBar";
import UsersTable from "../mba/components/users/UsersTable";
import UserDetailDrawer, {
  UserNote,
} from "../mba/components/users/UserDetailDrawer";

// 👇 This must match the server-side ADMIN_ADMIN_SECRET
const ADMIN_SECRET =
  process.env.NEXT_PUBLIC_ADMIN_ADMIN_SECRET || "";

// Helper to reuse headers everywhere
const ADMIN_HEADERS: HeadersInit = ADMIN_SECRET
  ? { "x-admin-secret": ADMIN_SECRET }
  : {};

export type AdminUser = {
  _id: string;
  email: string;
  name?: string;
  image?: string;
  role: "admin" | "user";
  loginCount: number;
  lastLogin: string; // ISO string
  createdAt: string; // ISO string
  notes?: UserNote[];
};

type RoleFilter = "all" | "admin" | "user";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Build query string based on filters – reused for fetch + CSV export
  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (roleFilter !== "all") {
      params.set("role", roleFilter);
    }
    if (dateFrom) {
      params.set("startDate", dateFrom);
    }
    if (dateTo) {
      params.set("endDate", dateTo);
    }
    if (search.trim().length > 0) {
      params.set("q", search.trim());
    }

    return params.toString();
  }, [roleFilter, dateFrom, dateTo, search]);

  // Fetch users whenever filters change
  useEffect(() => {
    const controller = new AbortController();

    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);

        const url = queryString
          ? `/api/admin/users?${queryString}`
          : "/api/admin/users";

        const res = await fetch(url, {
          method: "GET",
          headers: ADMIN_HEADERS,
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) {
          // This is what you’re seeing now (401)
          throw new Error(`Failed to fetch users (${res.status})`);
        }

        const data = await res.json();

        // Expecting API returns { users: [...] } or just an array.
        const list: AdminUser[] = Array.isArray(data)
          ? data
          : data.users ?? [];

        setUsers(list);
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
  }, [queryString]);

  const handleResetFilters = () => {
    setRoleFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  // Export CSV with header (cannot use window.location if we need custom headers)
  const handleExportCsv = async () => {
    try {
      const url = queryString
        ? `/api/admin/users/export?${queryString}`
        : "/api/admin/users/export";

      const res = await fetch(url, {
        method: "GET",
        headers: ADMIN_HEADERS,
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
      // Optional: set a toast or local error state
    }
  };

  const handleSelectUser = (user: AdminUser) => {
    setSelectedUser(user);
  };

  const handleNoteAdded = (userId: string, notes: UserNote[]) => {
    // Update selected user
    setSelectedUser((prev) =>
      prev && prev._id === userId ? { ...prev, notes } : prev
    );
    // Sync notes into main list
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, notes } : u))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 px-6 py-5 text-white shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-sky-100/90">
              Logged-in Users · lightweight CRM view
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20 transition"
          >
            ⬇️ Export CSV
          </button>
        </div>
      </header>

      {/* Filters */}
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

      {/* Table */}
      <UsersTable
        users={users}
        loading={loading}
        error={error}
        onSelectUser={handleSelectUser}
      />

      {/* Drawer */}
      <UserDetailDrawer
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onNoteAdded={handleNoteAdded}
      />
    </div>
  );
}
