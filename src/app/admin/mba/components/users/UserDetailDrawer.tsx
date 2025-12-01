"use client";

import React, { useState } from "react";
import type { AdminUser, UserNote } from "../../../dashboard/page";

type Props = {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
  onNoteAdded: (userId: string, notes: UserNote[]) => void;
};

const UserDetailDrawer: React.FC<Props> = ({
  user,
  open,
  onClose,
  onNoteAdded,
}) => {
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !user) {
    return null;
  }

  const handleSubmit = async () => {
    const text = noteText.trim();
    if (!text) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`/api/admin/users/${user._id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add note");
      }

      const data = await res.json();
      const updatedNotes: UserNote[] = data.notes ?? [];

      onNoteAdded(user._id, updatedNotes);
      setNoteText("");
    } catch (err: any) {
      console.error("[UserDetailDrawer] add note error:", err);
      setError(err.message || "Failed to add note");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  const notes = user.notes ?? [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-sky-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                User Profile
              </h2>
              <p className="text-xs text-sky-100/90">
                Internal notes for this logged-in user
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Basic info */}
          <section className="rounded-xl border border-sky-100 bg-sky-50/40 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Basic Info
            </p>
            <div className="mt-2 space-y-1 text-sm text-slate-800">
              <p>
                <span className="font-medium">Name:&nbsp;</span>
                {user.name || "—"}
              </p>
              <p>
                <span className="font-medium">Email:&nbsp;</span>
                <span className="font-mono text-xs bg-white/70 px-2 py-0.5 rounded-full">
                  {user.email}
                </span>
              </p>
              <p>
                <span className="font-medium">Role:&nbsp;</span>
                {user.role}
              </p>
              <p>
                <span className="font-medium">Login Count:&nbsp;</span>
                {user.loginCount ?? 0}
              </p>
              <p>
                <span className="font-medium">Last Login:&nbsp;</span>
                {formatDate(user.lastLogin)}
              </p>
              <p>
                <span className="font-medium">Created At:&nbsp;</span>
                {formatDate(user.createdAt)}
              </p>
            </div>
          </section>

          {/* Notes list */}
          <section className="rounded-xl border border-slate-100 bg-white px-4 py-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Internal Notes
            </p>

            {notes.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                No notes yet. Use the box below to add your first note about
                this user (e.g., “interested in EU MBAs”, “needs GMAT help”).
              </p>
            ) : (
              <ul className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {notes
                  .slice()
                  .reverse()
                  .map((note, idx) => (
                    <li
                      key={idx}
                      className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">
                        {note.text}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {formatDate(note.createdAt)}
                      </p>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          {/* Add note */}
          <section className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
              Add Note
            </p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              placeholder="Write an internal note about this user…"
              className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
            />
            {error && (
              <p className="text-xs text-red-600">
                {error}
              </p>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                disabled={submitting || !noteText.trim()}
                onClick={handleSubmit}
                className="inline-flex items-center rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving…" : "Save Note"}
              </button>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
};

export default UserDetailDrawer;
