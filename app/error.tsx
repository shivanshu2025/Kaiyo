'use client';

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#E9E9E7]">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">Something went wrong!</h2>
        <p className="mb-6 text-gray-600">An unexpected error occurred. Please try again.</p>
        <button
          onClick={reset}
          className="rounded-full bg-[#32483e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a3d34]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
