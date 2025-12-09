import React from "react";

type BuilderLayoutProps = {
  left: React.ReactNode;   // form / stepper
  right: React.ReactNode;  // live preview
};

/**
 * Two-pane layout used by Resume Writer:
 * - Left: multi-step form
 * - Right: live resume preview (sticky on desktop)
 *
 * Mobile: stacked (form on top, preview below)
 */
export default function BuilderLayout({ left, right }: BuilderLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row">
      {/* LEFT – FORM PANEL */}
      <section className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/60">
        <div className="h-full max-h-[calc(100vh-8rem)] lg:max-h-none overflow-y-auto">
          <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {left}
          </div>
        </div>
      </section>

      {/* RIGHT – PREVIEW PANEL */}
      <section className="w-full lg:w-1/2 bg-white">
        <div className="h-full lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {right}
          </div>
        </div>
      </section>
    </div>
  );
}
