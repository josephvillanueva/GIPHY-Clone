import { useParams } from "react-router-dom";
import { GifState } from "../context/gif-context";
import { useGiphyPages } from "../hooks/use-giphy-pages";
import FilterGif from "../components/filter-gif";
import { GifGrid, PageFooter } from "../components/gif-grid";
import {
  EmptyMessage,
  ErrorMessage,
  GifGridSkeleton,
} from "../components/status";

const PAGE_SIZE = 20;

const Search = () => {
  const { gf, filter } = GifState();
  const { query } = useParams();

  // Keyed on the query as well as the filter, so a new search or a filter
  // change starts again from the first page.
  const { status, items, hasMore, loadingMore, pageRetryAt, loadMore, retry, retryAt } =
    useGiphyPages(`search:${query}:${filter}`, (offset) =>
      gf.search(query, {
        sort: "relevant",
        lang: "en",
        type: filter,
        limit: PAGE_SIZE,
        offset,
      }),
    );

  return (
    <div className="my-4">
      <h2 className="text-5xl pb-3 font-extrabold break-words">{query}</h2>
      <FilterGif alignLeft={true} />

      {status === "loading" && <GifGridSkeleton />}
      {status === "error" && <ErrorMessage onRetry={retry} retryAt={retryAt} />}
      {status === "success" &&
        (items.length > 0 ? (
          <>
            <GifGrid gifs={items} maxColumns={4} />
            <PageFooter
              hasMore={hasMore}
              loadingMore={loadingMore}
              pageRetryAt={pageRetryAt}
              onLoadMore={loadMore}
            />
          </>
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
