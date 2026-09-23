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
  const [attempt, setAttempt] = useState(0);
  const token = `${requestKey}#${attempt}`;

  const loading = { token, status: "loading", data: initialData, error: null, retryAt: null };
  const [state, setState] = useState(loading);

  // A new request resets to loading during render, the pattern React
  // recommends over resetting state inside an effect.
  if (state.token !== token) setState(loading);

  useEffect(() => {
    let current = true;

    fetcher()
      .then((response) => {
        if (current) {
          setState({ token, status: "success", data: response.data, error: null, retryAt: null });
        }
      })
      .catch((error) => {
        console.error("GIPHY request failed", error);
        if (current) {
          setState({
            token,
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
    // The fetcher and initialData are recreated on every render; the token
    // captures every input that should trigger a new request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const view = state.token === token ? state : loading;
  return { status: view.status, data: view.data, error: view.error, retryAt: view.retryAt, retry };
}
