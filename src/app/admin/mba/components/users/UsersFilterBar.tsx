"use client";

import React from "react";

type RoleFilter = "all" | "admin" | "user";

type Props = {
  roleFilter: RoleFilter;
  dateFrom: string;
  dateTo: string;
  search: string;
  onRoleChange: (role: RoleFilter) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
  onExport: () => void;
};

const UsersFilterBar: React.FC<Props> = ({
  roleFilter,
  dateFrom,
  dateTo,
  search,
  onRoleChange,
  onDateFromChange,
  onDateToChange,
  onSearchChange,
  onReset,
  onExport,
}) => {
  return (
    <section className="rounded-2xl bg-white shadow-sm border border-sky-100/70">
      <div className="border-b border-sky-50 bg-gradient-to-r from-sky-50 via-teal-50 to-emerald-50 rounded-t-2xl px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Filters &amp; Search
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Narrow down users by role, login date, or name/email.
        </p>
      </div>

      <div className="px-5 py-4 grid gap-4 md:grid-cols-4">
        {/* Role */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            Role
          </label>
          <select
            value={roleFilter}
            onChange={(e) => onRoleChange(e.target.value as RoleFilter)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
          >
            <option value="all">All roles</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
          </select>
        </div>

        {/* Date from */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            From (Last Login)
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
          />
        </div>

        {/* Date to */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            To (Last Login)
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
          />
        </div>

        {/* Search */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            Search (name/email)
          </label>
          <input
            type="text"
            placeholder="e.g. omkar@ or Anna"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block h-2 w-2 rounded-full bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500" />
          <span>Ocean–Teal–Emerald filtered view</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onExport}
            className="rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:from-teal-600 hover:to-emerald-600"
          >
            Export CSV
          </button>
        </div>
      </div>
    </section>
  );
};

export default UsersFilterBar;
