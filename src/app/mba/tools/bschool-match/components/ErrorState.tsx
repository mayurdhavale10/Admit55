"use client";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">
        Something went wrong
      </p>
      <p className="mt-1 text-sm text-rose-900">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center rounded-full bg-rose-500 px-3 py-1 text-xs font-medium text-white hover:bg-rose-400"
        >
          Try again
        </button>
      )}
    </div>
  );
}
