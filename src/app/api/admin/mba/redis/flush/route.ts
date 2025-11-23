// import { NextResponse } from "next/server";
// import { getRedis } from "@src/modules/data-client/redis";
// import { requireAdmin } from "@/src/modules/security/authz";

// export const dynamic = "force-dynamic";

// // POST /api/admin/mba/redis/flush
// export async function POST(req: Request) {
//   try {
//     requireAdmin(req);

//     const r = getRedis();
//     if ((r as any).status !== "ready") {
//       await (r as any).connect?.().catch(() => {});
//     }

//     const pattern = "admit55:*"; // or "admit55:mba:*" to be stricter
//     let cursor = "0";
//     let flushed = 0;

//     do {
//       const [next, keys] = await r.scan(cursor, "MATCH", pattern, "COUNT", 200);
//       cursor = next;
//       if (keys.length > 0) {
//         flushed += keys.length;
//         await r.del(...keys);
//       }
//     } while (cursor !== "0");

//     return NextResponse.json({ ok: true, flushed });
//   } catch (err: any) {
//     const status = err?.status ?? 500;
//     const message = err?.message ?? "internal_error";
//     return NextResponse.json({ ok: false, error: message }, { status });
//   }
// }
