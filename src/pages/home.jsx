import { GifState } from "../context/gif-context";
import { useGiphyPages } from "../hooks/use-giphy-pages";
import FilterGif from "../components/filter-gif";
import { GifGrid, PageFooter } from "../components/gif-grid";
import { ErrorMessage, GifGridSkeleton } from "../components/status";

const PAGE_SIZE = 20;

function Home() {
  const { gf, filter } = GifState();
  const { status, items, hasMore, loadingMore, pageRetryAt, loadMore, retry, retryAt } =
    useGiphyPages(`trending:${filter}`, (offset) =>
      gf.trending({ limit: PAGE_SIZE, offset, type: filter, rating: "g" }),
    );

  return (
    <div>
      <img src="/banner.gif" alt="" className="mt-2 rounded w-full" />

      <FilterGif showTrending />

      {status === "loading" && <GifGridSkeleton />}
      {status === "error" && <ErrorMessage onRetry={retry} retryAt={retryAt} />}
      {status === "success" && (
        <>
          <GifGrid gifs={items} maxColumns={5} />
          <PageFooter
            hasMore={hasMore}
            loadingMore={loadingMore}
            pageRetryAt={pageRetryAt}
            onLoadMore={loadMore}
          />
        </>
      )}
    </div>
  );
}

export default Home;
