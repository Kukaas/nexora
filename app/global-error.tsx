"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-lg font-semibold">Something went wrong!</h2>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
