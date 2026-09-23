import { useCallback, useEffect, useRef, useState } from "react";

// @giphy/js-fetch-api caches failed requests by URL for six seconds, so a
// retry is offered once that window has passed (see use-giphy.js).
const SDK_ERROR_CACHE_MS = 6000;

// GIPHY rejects offsets above this for trending and search.
const MAX_OFFSET = 4999;

const initialState = {
  token: null,
  status: "loading",
  items: [],
  hasMore: false,
  loadingMore: false,
  error: null,
  retryAt: null,
  pageRetryAt: null,
};

function hasMoreAfter({ data, pagination }) {
  const next = pagination.offset + pagination.count;
  return data.length > 0 && next < pagination.total_count && next <= MAX_OFFSET;
}

/**
 * Paginated version of useGiphy for trending and search. `fetchPage(offset)`
 * must return a GIPHY response with `data` and `pagination`. Changing
 * `requestKey` (query, filter...) starts again from the first page, and
 * responses from a superseded key are ignored. GIFs already shown are
 * skipped, so a result that shifts between pages never appears twice.
 */
export function useGiphyPages(requestKey, fetchPage) {
  const [attempt, setAttempt] = useState(0);
  const token = `${requestKey}#${attempt}`;
  const [state, setState] = useState({ ...initialState, token });

  // A new query, filter, or retry resets to page one during render, the
  // pattern React recommends over resetting state inside an effect.
  if (state.token !== token) setState({ ...initialState, token });

  // Always call the latest fetcher; it closes over the current query/filter.
  const fetchRef = useRef(fetchPage);
  useEffect(() => {
    fetchRef.current = fetchPage;
  });

  const generation = useRef(0);
  const nextOffset = useRef(0);
  const seen = useRef(new Set());
  const inFlight = useRef(false);

  const takeNew = (gifs) =>
    gifs.filter((gif) => {
      if (seen.current.has(gif.id)) return false;
      seen.current.add(gif.id);
      return true;
    });

  useEffect(() => {
    const current = ++generation.current;
    nextOffset.current = 0;
    seen.current = new Set();
    inFlight.current = false;

    fetchRef
      .current(0)
      .then((response) => {
        if (current !== generation.current) return;
        nextOffset.current = response.pagination.offset + response.pagination.count;
        setState({
          ...initialState,
          token,
          status: "success",
          items: takeNew(response.data),
          hasMore: hasMoreAfter(response),
        });
      })
      .catch((error) => {
        console.error("GIPHY request failed", error);
        if (current !== generation.current) return;
        setState({
          ...initialState,
          token,
          status: "error",
          error,
          retryAt: Date.now() + SDK_ERROR_CACHE_MS,
        });
      });
  }, [token]);

  const loadMore = useCallback(() => {
    if (inFlight.current) return;
    inFlight.current = true;
    const current = generation.current;
    setState((prev) => ({ ...prev, loadingMore: true, pageRetryAt: null }));

    fetchRef
      .current(nextOffset.current)
      .then((response) => {
        if (current !== generation.current) return;
        nextOffset.current = response.pagination.offset + response.pagination.count;
        const fresh = takeNew(response.data);
        setState((prev) => ({
          ...prev,
          items: [...prev.items, ...fresh],
          hasMore: hasMoreAfter(response),
          loadingMore: false,
        }));
      })
      .catch((error) => {
        console.error("GIPHY request failed", error);
        if (current !== generation.current) return;
        setState((prev) => ({
          ...prev,
          loadingMore: false,
          pageRetryAt: Date.now() + SDK_ERROR_CACHE_MS,
        }));
      })
      .finally(() => {
        if (current === generation.current) inFlight.current = false;
      });
  }, []);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const view = state.token === token ? state : { ...initialState, token };
  return { ...view, loadMore, retry };
}
