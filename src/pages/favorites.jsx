import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Gif from "../components/gif";
import { GifState } from "../context/gif-context";
import { useGiphy } from "../hooks/use-giphy";
import { createTransferUrl, fetchFavorites, readTransfer } from "../lib/favorites";
import FavoritesAccount from "../components/favorites-account";
import {
  EmptyMessage,
  ErrorMessage,
  GifGridSkeleton,
} from "../components/status";

const Favorites = () => {
  const { gf, favorites, importFavorites, authLoading } = GifState();
  const [params, setParams] = useSearchParams();
  const transfer = readTransfer(params);
  const ids = transfer.ids ?? favorites;
  const hasFavorites = ids.length > 0;
  const newCount = transfer.ids?.filter((id) => !favorites.includes(id)).length ?? 0;
  const [message, setMessage] = useState("");
  const [manualLink, setManualLink] = useState("");

  const copyFavorites = async () => {
    try {
      const url = createTransferUrl(favorites, window.location.origin);
      try {
        await navigator.clipboard.writeText(url);
        setManualLink("");
        setMessage("Favorites link copied. Open it on your other device.");
      } catch {
        setManualLink(url);
        setMessage("Copy the link below and open it on your other device.");
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  const addFavorites = () => {
    importFavorites(transfer.ids);
    const nextParams = new URLSearchParams(params);
    nextParams.delete("ids");
    setParams(nextParams, { replace: true });
    setMessage(`Added ${newCount} GIF${newCount === 1 ? "" : "s"} to your favorites.`);
    setManualLink("");
  };

  // Refetches when favorites change, and skips the request entirely when
  // there is nothing saved.
  const {
    status,
    data: gifs,
    retry,
    retryAt,
  } = useGiphy(`favorites:${ids.join(",")}`, () =>
    fetchFavorites(gf, ids),
  );

  return (
    <div className="mt-2">
      <h2 className="faded-text">{transfer.ids ? "Favorites from this link" : "My Favorites"}</h2>
      <FavoritesAccount />

      {transfer.error && <p role="alert" className="my-3 text-red-300">{transfer.error}</p>}

      {transfer.ids ? (
        <section className="my-4 space-y-3" aria-label="Import favorites">
          <p>Preview these {transfer.ids.length} GIFs before adding them to your favorites. Your existing favorites will be kept.</p>
          <button type="button" onClick={addFavorites} disabled={!newCount || authLoading}
            className="rounded bg-purple-700 px-4 py-2 font-bold disabled:opacity-50">
            {newCount ? "Add these to my favorites" : "Already in your favorites"}
          </button>
          <Link to="/favorites" className="ml-4 underline">View my favorites</Link>
        </section>
      ) : (
        <section className="my-4 space-y-3" aria-label="Transfer favorites">
          <p>Take your saved GIFs to another device with a link. Anyone with the link can see the included GIFs. The link is a snapshot and will not update when your favorites change.</p>
          <button type="button" onClick={copyFavorites} disabled={!favorites.length}
            className="rounded bg-purple-700 px-4 py-2 font-bold disabled:opacity-50">
            Copy link to my favorites
          </button>
        </section>
      )}
      <p role="status" className="my-2">{message}</p>
      {manualLink && (
        <label className="block my-3">Favorites link
          <input type="text" readOnly value={manualLink} onFocus={(event) => event.target.select()}
            className="block w-full rounded border border-gray-500 p-2 mt-1" />
        </label>
      )}

      {!hasFavorites ? (
        <EmptyMessage>
          You haven&apos;t saved any GIFs yet. Open one and press Favorite, or{" "}
          <Link to="/" className="underline">
            browse what&apos;s trending
          </Link>
          .
        </EmptyMessage>
      ) : status === "loading" ? (
        <GifGridSkeleton count={Math.min(ids.length, 10)} />
      ) : status === "error" ? (
        <ErrorMessage onRetry={retry} retryAt={retryAt} />
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 mt-2">
          {gifs.map((gif) => (
            <Gif gif={gif} key={gif.id} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
