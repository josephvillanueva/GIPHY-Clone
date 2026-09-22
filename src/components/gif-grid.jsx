/* eslint-disable react/prop-types */

import { useEffect, useRef, useState } from "react";
import Gif from "./gif";
import { EmptyMessage, ErrorMessage } from "./status";

// Widest breakpoint first; mirrors the Tailwind md/lg/xl breakpoints.
const COLUMN_BREAKPOINTS = [
  ["(min-width: 1280px)", 5],
  ["(min-width: 1024px)", 4],
  ["(min-width: 768px)", 3],
];

function columnsForViewport(maxColumns) {
  const match = COLUMN_BREAKPOINTS.find(([query]) => window.matchMedia(query).matches);
  return Math.min(match ? match[1] : 2, maxColumns);
}

function useColumnCount(maxColumns) {
  const [count, setCount] = useState(() => columnsForViewport(maxColumns));

  useEffect(() => {
    const update = () => setCount(columnsForViewport(maxColumns));
    const lists = COLUMN_BREAKPOINTS.map(([query]) => window.matchMedia(query));
    lists.forEach((list) => list.addEventListener("change", update));
    update();
    return () => lists.forEach((list) => list.removeEventListener("change", update));
  }, [maxColumns]);

  return count;
}

/**
 * Masonry grid that assigns each GIF to a fixed column (index modulo the
 * column count). Unlike CSS columns, appending a page adds to the bottom of
 * each column instead of reflowing every GIF already on screen.
 */
export function GifGrid({ gifs, maxColumns = 5 }) {
  const count = useColumnCount(maxColumns);
  const columns = Array.from({ length: count }, () => []);
  gifs.forEach((gif, index) => columns[index % count].push(gif));

  return (
    <div className="flex gap-2">
      {columns.map((column, index) => (
        <div key={index} className="flex min-w-0 flex-1 flex-col">
          {column.map((gif) => (
            <Gif gif={gif} key={gif.id} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Calls `onReach` when the user scrolls within ~800px of the end of the list,
 * so the next page is usually ready before they get there.
 */
function Sentinel({ onReach }) {
  const ref = useRef(null);
  const onReachRef = useRef(onReach);
  useEffect(() => {
    onReachRef.current = onReach;
  });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onReachRef.current();
      },
      { rootMargin: "0px 0px 800px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} aria-hidden="true" className="h-px" />;
}

/**
 * What follows a paginated grid: the load trigger, a loading row, a retry
 * for a failed page, or the end-of-results note.
 */
export function PageFooter({ hasMore, loadingMore, pageRetryAt, onLoadMore }) {
  if (pageRetryAt) return <ErrorMessage onRetry={onLoadMore} retryAt={pageRetryAt} />;

  if (loadingMore) {
    return (
      <p role="status" className="my-6 text-center text-gray-300">
        Loading more GIFs...
      </p>
    );
  }

  if (hasMore) return <Sentinel onReach={onLoadMore} />;

  return <EmptyMessage>That&apos;s everything for now.</EmptyMessage>;
}
