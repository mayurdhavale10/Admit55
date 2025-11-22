// very light repair for trailing commas / single quotes
export function tryRepairJson(raw: string): string | null {
  let s = raw.trim();

  // Strip pre/post prose if the model leaked it
  const first = s.indexOf("{");
  const last  = s.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) s = s.slice(first, last + 1);

  // Common annoyances
  s = s.replace(/,\s*([}\]])/g, "$1"); // trailing commas
  s = s.replace(/“|”/g, '"').replace(/‘|’/g, "'"); // smart quotes → plain
  try {
    JSON.parse(s);
    return s;
  } catch { return null; }
}
