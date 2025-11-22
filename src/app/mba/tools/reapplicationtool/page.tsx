"use client";

export default function ReapplicationToolPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Reapplication Tool</h1>
      <p className="text-gray-700">
        This module helps prior applicants diagnose last cycle issues and craft a stronger reapply plan.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-gray-700">
        <li>Upload last cycle materials (resume, essays, rec summaries)</li>
        <li>Get gap analysis (what changed, what must change)</li>
        <li>Generate a concrete reapply roadmap</li>
      </ul>
      <div className="mt-4 text-sm text-gray-500">
        Minimal UI placeholder — wire APIs next.
      </div>
    </main>
  );
}
