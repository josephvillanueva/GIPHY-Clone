import { useParams } from "react-router-dom";
import { GifState } from "../context/gif-context";
import { useGiphy } from "../hooks/use-giphy";
import Gif from "../components/gif";
import FilterGif from "../components/filter-gif";
import {
  EmptyMessage,
  ErrorMessage,
  GifGridSkeleton,
} from "../components/status";

const Search = () => {
  const { gf, filter } = GifState();
  const { query } = useParams();

  // Keyed on the query as well as the filter, so a second search from this
  // page refetches instead of showing the previous term's results.
  const {
    status,
    data: results,
    retry,
    retryAt,
  } = useGiphy(`search:${query}:${filter}`, () =>
    gf.search(query, { sort: "relevant", lang: "en", type: filter, limit: 20 }),
  );

  return (
    <div className="my-4">
      <h2 className="text-5xl pb-3 font-extrabold break-words">{query}</h2>
      <FilterGif alignLeft={true} />

      {status === "loading" && <GifGridSkeleton />}
      {status === "error" && <ErrorMessage onRetry={retry} retryAt={retryAt} />}
      {status === "success" &&
        (results.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-2">
            {results.map((gif) => (
              <Gif gif={gif} key={gif.id} />
            ))}
          </div>
        ) : (
          <EmptyMessage>
            No results for &ldquo;{query}&rdquo;. Try another word, or switch
            between GIFs, Stickers, and Text.
          </EmptyMessage>
        ))}
    </div>
  );
};

export default Search;
