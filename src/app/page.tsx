import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Admit55</h1>
      <p style={{ marginBottom: 24 }}>
        Welcome! Choose a tool to begin.
      </p>

      <nav style={{ display: "flex", gap: 12 }}>
        <Link href="/tools/profileresumetool">
          <button style={{ padding: "10px 14px", cursor: "pointer" }}>
            Open Profile-Resume Tool
          </button>
        </Link>
        <Link href="/admin/profileresumetool">
          <button style={{ padding: "10px 14px", cursor: "pointer" }}>
            Admin Console
          </button>
        </Link>
      </nav>
    </main>
  );
}
