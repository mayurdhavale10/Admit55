// src/app/admin/users/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { authOptions } from "@src/app/api/auth/[...nextauth]/route";
import {
  connectDB,
  getLoggedInUsersCollection,
} from "@src/lib/db/loggedinuser/connectDB";
import { getLoggedInUserByEmail } from "@src/models/auth/UserLoggedIn";

import type { LLMProvider, ProviderQuotaDoc } from "@src/lib/db/usage/ProviderQuota";
import { getProviderQuotaCollection } from "@src/lib/db/usage/quota";

type SearchParams = { q?: string };

const DEFAULT_LIMITS: Record<LLMProvider, number> = {
  groq: Number(process.env.FREE_LIMIT_GROQ ?? 5),
  openai: Number(process.env.FREE_LIMIT_OPENAI ?? 5),
  ollama: Number(process.env.FREE_LIMIT_OLLAMA ?? 999999),
};

function fmtDate(d?: Date | string | null) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString();
}

function remaining(used: number, limit: number) {
  return Math.max(0, limit - used);
}

function isUnlimited(user: any) {
  return user?.role === "admin" || user?.plan === "pro";
}

async function requireAdminOrRedirect() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) redirect("/api/auth/signin?callbackUrl=/admin/users");

  const me = await getLoggedInUserByEmail(email);
  if (me?.role !== "admin") redirect("/profile");

  return { session, email };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  // ✅ Require admin to view page
  await requireAdminOrRedirect();

  // ---------- Server Actions ----------
  async function setPlanAction(formData: FormData) {
    "use server";

    // ✅ Re-check admin for every action
    await requireAdminOrRedirect();

    const targetEmail = String(formData.get("email") || "").trim();
    const plan = String(formData.get("plan") || "").trim(); // "free" | "pro"
    if (!targetEmail) return;

    if (plan !== "free" && plan !== "pro") {
      throw new Error("Invalid plan");
    }

    await connectDB();
    const col = await getLoggedInUsersCollection<any>();

    await col.updateOne(
      { email: targetEmail },
      { $set: { plan, planUpdatedAt: new Date(), updatedAt: new Date() } }
    );

    revalidatePath("/admin/users");
  }

  async function setRoleAction(formData: FormData) {
    "use server";

    // ✅ Re-check admin for every action
    const { email: actorEmail } = await requireAdminOrRedirect();

    const targetEmail = String(formData.get("email") || "").trim();
    const role = String(formData.get("role") || "").trim(); // "user" | "admin"
    if (!targetEmail) return;

    if (role !== "user" && role !== "admin") {
      throw new Error("Invalid role");
    }

    // Optional: prevent self-demotion (recommended)
    if (targetEmail === actorEmail && role !== "admin") {
      throw new Error("You cannot remove your own admin role.");
    }

    await connectDB();
    const col = await getLoggedInUsersCollection<any>();

    await col.updateOne(
      { email: targetEmail },
      { $set: { role, updatedAt: new Date() } }
    );

    revalidatePath("/admin/users");
  }

  async function resetQuotaAction(formData: FormData) {
    "use server";

    // ✅ Re-check admin for every action
    await requireAdminOrRedirect();

    const targetEmail = String(formData.get("email") || "").trim();
    if (!targetEmail) return;

    const quotaCol = await getProviderQuotaCollection<ProviderQuotaDoc>();
    await quotaCol.updateMany(
      { email: targetEmail },
      { $set: { used: 0, updatedAt: new Date() } }
    );

    revalidatePath("/admin/users");
  }

  // ---------- Fetch Users ----------
  await connectDB();
  const col = await getLoggedInUsersCollection<any>();

  const q = (searchParams?.q || "").trim();
  const filter =
    q.length > 0
      ? {
          $or: [
            { email: { $regex: q, $options: "i" } },
            { name: { $regex: q, $options: "i" } },
          ],
        }
      : {};

  const users = await col
    .find(filter, {
      projection: {
        email: 1,
        name: 1,
        image: 1,
        role: 1,
        plan: 1,
        planUpdatedAt: 1,
        createdAt: 1,
        updatedAt: 1,
        lastLogin: 1,
      },
    })
    .sort({ updatedAt: -1 })
    .limit(200)
    .toArray();

  // ---------- Fetch Quotas for these users ----------
  const emails = users.map((u: any) => u.email).filter(Boolean);
  const quotaCol = await getProviderQuotaCollection<ProviderQuotaDoc>();
  const quotaDocs = emails.length
    ? await quotaCol.find({ email: { $in: emails } }).toArray()
    : [];

  const quotaMap = new Map<string, Record<LLMProvider, number>>();
  for (const e of emails) quotaMap.set(e, { groq: 0, openai: 0, ollama: 0 });

  for (const doc of quotaDocs) {
    const row = quotaMap.get(doc.email) || { groq: 0, openai: 0, ollama: 0 };
    row[doc.provider] = doc.used ?? 0;
    quotaMap.set(doc.email, row);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full bg-gradient-to-b from-[#0A2540] to-[#1747D6] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Admin • Users
              </h1>
              <p className="text-blue-100/90 mt-2 text-sm">
                Manage roles, plans, and free quota usage.
              </p>
            </div>

            <form className="mt-4 sm:mt-0 flex gap-2" action="/admin/users" method="GET">
              <input
                name="q"
                defaultValue={q}
                placeholder="Search email / name…"
                className="w-64 max-w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/70 outline-none"
              />
              <button className="rounded-xl bg-white text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-slate-100">
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Role / Plan</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Quota (Groq / OpenAI / Ollama)
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Updated</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {users.map((u: any) => {
                  const used = quotaMap.get(u.email) || { groq: 0, openai: 0, ollama: 0 };
                  const unlimited = isUnlimited(u);

                  const groqLimit = unlimited ? Infinity : DEFAULT_LIMITS.groq;
                  const openaiLimit = unlimited ? Infinity : DEFAULT_LIMITS.openai;
                  const ollamaLimit = unlimited ? Infinity : DEFAULT_LIMITS.ollama;

                  const groqRem = unlimited ? Infinity : remaining(used.groq, DEFAULT_LIMITS.groq);
                  const openaiRem = unlimited ? Infinity : remaining(used.openai, DEFAULT_LIMITS.openai);
                  const ollamaRem = unlimited ? Infinity : remaining(used.ollama, DEFAULT_LIMITS.ollama);

                  const fmtRem = (x: number) => (x === Infinity ? "∞" : String(x));
                  const fmtLim = (x: number) => (x === Infinity ? "∞" : String(x));
                  const remClass = (x: number) =>
                    x !== Infinity && x <= 0
                      ? "font-semibold text-red-600"
                      : "font-semibold text-emerald-600";

                  return (
                    <tr key={u.email} className="bg-white">
                      <td className="px-4 py-4 align-top">
                        <div className="font-semibold text-slate-900">{u.name || "—"}</div>
                        <div className="text-slate-600">{u.email}</div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-slate-800">
                          Role: <span className="font-semibold">{u.role ?? "user"}</span>
                        </div>
                        <div className="text-slate-800">
                          Plan: <span className="font-semibold">{u.plan ?? "free"}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Plan updated: {fmtDate(u.planUpdatedAt)}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="text-slate-800">
                          Groq: <span className="font-semibold">{used.groq}</span>/{fmtLim(groqLimit as any)} • rem{" "}
                          <span className={remClass(groqRem as any)}>{fmtRem(groqRem as any)}</span>
                        </div>
                        <div className="text-slate-800">
                          OpenAI: <span className="font-semibold">{used.openai}</span>/{fmtLim(openaiLimit as any)} • rem{" "}
                          <span className={remClass(openaiRem as any)}>{fmtRem(openaiRem as any)}</span>
                        </div>
                        <div className="text-slate-800">
                          Ollama: <span className="font-semibold">{used.ollama}</span>/{fmtLim(ollamaLimit as any)} • rem{" "}
                          <span className={remClass(ollamaRem as any)}>{fmtRem(ollamaRem as any)}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top text-slate-600">
                        {fmtDate(u.updatedAt || u.createdAt)}
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <form action={setPlanAction}>
                              <input type="hidden" name="email" value={u.email} />
                              <input type="hidden" name="plan" value="pro" />
                              <button className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                                Make Pro
                              </button>
                            </form>

                            <form action={setPlanAction}>
                              <input type="hidden" name="email" value={u.email} />
                              <input type="hidden" name="plan" value="free" />
                              <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                                Make Free
                              </button>
                            </form>
                          </div>

                          <div className="flex gap-2">
                            <form action={setRoleAction}>
                              <input type="hidden" name="email" value={u.email} />
                              <input type="hidden" name="role" value="admin" />
                              <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                                Make Admin
                              </button>
                            </form>

                            <form action={setRoleAction}>
                              <input type="hidden" name="email" value={u.email} />
                              <input type="hidden" name="role" value="user" />
                              <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                                Make User
                              </button>
                            </form>
                          </div>

                          <form action={resetQuotaAction}>
                            <input type="hidden" name="email" value={u.email} />
                            <button className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600">
                              Reset Quota
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-600">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Showing up to 200 users. Limits: Groq={DEFAULT_LIMITS.groq}, OpenAI={DEFAULT_LIMITS.openai}, Ollama={DEFAULT_LIMITS.ollama}.
          Pro/Admin show ∞.
        </p>
      </div>
    </div>
  );
}
