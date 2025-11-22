import { htmlToText } from "./utils/htmlToText";
import { writeInbox } from "@src/modules/data-client/storage";

const SEARCH_URL = (q: string, page: number, perPage: number) =>
  `https://api.github.com/search/users?q=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}`;

async function fetchJSON(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "Admit55/collector" } });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return res.json();
}

async function fetchUserReadme(login: string) {
  // try profile README at https://raw.githubusercontent.com/<login>/<login>/master/README.md (or main)
  const tries = [
    `https://raw.githubusercontent.com/${login}/${login}/master/README.md`,
    `https://raw.githubusercontent.com/${login}/${login}/main/README.md`,
  ];
  for (const url of tries) {
    const r = await fetch(url, { headers: { "User-Agent": "Admit55/collector" } });
    if (r.ok) return await r.text();
  }
  return "";
}

export async function runGitHubCollector(params: { query: string; pages: number; perPage: number }) {
  const { query, pages, perPage } = params;
  for (let p = 1; p <= pages; p++) {
    const data = await fetchJSON(SEARCH_URL(query, p, perPage));
    const users: Array<{ login: string }> = data.items ?? [];
    for (const u of users) {
      const readme = await fetchUserReadme(u.login);
      const profile = `GitHub user: ${u.login}\n\n${readme}`;
      const text = htmlToText(profile);
      if (text.trim().length < 200) continue; // skip empty
      await writeInbox("github", `${u.login}.txt`, text);
    }
  }
}
