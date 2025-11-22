// Lightweight admin gate using a shared token header
export function requireAdmin(req: Request) {
  const headers = req.headers;

  const bearer = headers.get("authorization")?.trim();
  const headerToken =
    headers.get("x-admin-token")?.trim() ||
    (bearer && bearer.toLowerCase().startsWith("bearer ")
      ? bearer.slice(7).trim()
      : null);

  const envToken = process.env.ADMIN_TOKEN?.trim();
  if (!envToken) {
    const e: any = new Error("ADMIN_TOKEN not set");
    e.status = 500;
    throw e;
  }
  if (!headerToken || headerToken !== envToken) {
    const e: any = new Error("unauthorized");
    e.status = 401;
    throw e;
  }
}
