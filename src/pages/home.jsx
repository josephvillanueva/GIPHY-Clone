import { GifState } from "../context/gif-context";
import { useGiphy } from "../hooks/use-giphy";
import Gif from "../components/gif";
import FilterGif from "../components/filter-gif";
import { ErrorMessage, GifGridSkeleton } from "../components/status";

function Home() {
  const { gf, filter } = GifState();
  const {
    status,
    data: gifs,
    retry,
    retryAt,
  } = useGiphy(`trending:${filter}`, () =>
    gf.trending({ limit: 20, type: filter, rating: "g" }),
  );

  return (
    <div>
      <img src="/banner.gif" alt="" className="mt-2 rounded w-full" />

      <FilterGif showTrending />

      {status === "loading" && <GifGridSkeleton />}
      {status === "error" && <ErrorMessage onRetry={retry} retryAt={retryAt} />}
      {status === "success" && (
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2">
          {gifs.map((gif) => (
            <Gif gif={gif} key={gif.id} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
