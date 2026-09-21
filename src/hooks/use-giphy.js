import { useCallback, useEffect, useState } from "react";

// @giphy/js-fetch-api caches failed requests by URL for six seconds, so an
// immediate retry would just receive the cached failure. Retrying is offered
// once that window has passed.
const SDK_ERROR_CACHE_MS = 6000;

/**
 * Runs a GIPHY request whenever `requestKey` changes and tracks its status.
 * `requestKey` should encode every input the fetcher uses (query, filter,
 * id...), so navigating between routes that render the same component still
 * refetches. Responses from superseded requests are ignored, so a slow
 * earlier request can never overwrite newer results.
 */
export function useGiphy(requestKey, fetcher, initialData = []) {
  const [state, setState] = useState({
    status: "loading",
    data: initialData,
    error: null,
    retryAt: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setState({
      status: "loading",
      data: initialData,
      error: null,
      retryAt: null,
    });

    fetcher()
      .then((response) => {
        if (current) {
          setState({
            status: "success",
            data: response.data,
            error: null,
            retryAt: null,
          });
        }
      })
      .catch((error) => {
        console.error("GIPHY request failed", error);
        if (current) {
          setState({
            status: "error",
            data: initialData,
            error,
            retryAt: Date.now() + SDK_ERROR_CACHE_MS,
          });
        }
      });

    return () => {
      current = false;
    };
    // The fetcher is recreated on every render; requestKey captures its inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
}
