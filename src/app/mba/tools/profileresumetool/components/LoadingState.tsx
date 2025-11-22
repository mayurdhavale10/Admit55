"use client";

export default function LoadingState({ label = "Processing your resume..." }: { label?: string }) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16 text-center">
      {/* Spinner */}
      <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>

      {/* Text */}
      <p className="mt-5 text-gray-700 font-medium text-base tracking-wide">
        {label}
      </p>

      {/* Subtext */}
      <p className="mt-2 text-gray-500 text-sm max-w-sm">
        This may take 10–20 seconds depending on resume length and rewriting steps.
      </p>
    </div>
  );
}
