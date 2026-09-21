/* eslint-disable react/prop-types */

import { useEffect, useState } from "react";

export const GifGridSkeleton = ({ count = 10 }) => (
  <div
    className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2"
    aria-busy="true"
    aria-label="Loading GIFs"
  >
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className="mb-2 w-full animate-pulse rounded bg-gray-700"
        style={{ height: `${120 + ((i * 37) % 90)}px` }}
      />
    ))}
  </div>
);

export const ErrorMessage = ({ onRetry, retryAt }) => {
  const [now, setNow] = useState(() => Date.now());
  const secondsLeft = retryAt
    ? Math.max(0, Math.ceil((retryAt - now) / 1000))
    : 0;

  useEffect(() => {
    if (secondsLeft === 0) return;
    const timer = setTimeout(() => setNow(Date.now()), 250);
    return () => clearTimeout(timer);
  }, [now, secondsLeft]);

  return (
    <div
      role="alert"
      className="my-8 flex flex-col items-center gap-3 rounded bg-gray-800 p-6 text-center"
    >
      <p>Couldn&apos;t reach GIPHY. Check your connection and try again.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={secondsLeft > 0}
          className="rounded bg-gradient-to-tr from-pink-600 to-pink-400 px-4 py-2 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {secondsLeft > 0 ? `Try again in ${secondsLeft}s` : "Try again"}
        </button>
      )}
    </div>
  );
};

export const EmptyMessage = ({ children }) => (
  <p className="my-8 text-center text-gray-300">{children}</p>
);
