import { Link } from "react-router-dom";
import Gif from "../components/gif";
import { GifState } from "../context/gif-context";
import { useGiphy } from "../hooks/use-giphy";
import {
  EmptyMessage,
  ErrorMessage,
  GifGridSkeleton,
} from "../components/status";

const Favorites = () => {
  const { gf, favorites } = GifState();
  const hasFavorites = favorites.length > 0;

  // Refetches when favorites change, and skips the request entirely when
  // there is nothing saved.
  const {
    status,
    data: gifs,
    retry,
    retryAt,
  } = useGiphy(`favorites:${favorites.join(",")}`, () =>
    hasFavorites ? gf.gifs(favorites) : Promise.resolve({ data: [] }),
  );

  return (
    <div className="mt-2">
      <h2 className="faded-text">My Favorites</h2>

      {!hasFavorites ? (
        <EmptyMessage>
          You haven&apos;t saved any GIFs yet. Open one and press Favorite, or{" "}
          <Link to="/" className="underline">
            browse what&apos;s trending
          </Link>
          .
        </EmptyMessage>
      ) : status === "loading" ? (
        <GifGridSkeleton count={Math.min(favorites.length, 10)} />
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
