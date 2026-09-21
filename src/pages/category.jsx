import { useParams } from "react-router-dom";
import { GifState } from "../context/gif-context";
import { useGiphy } from "../hooks/use-giphy";
import Gif from "../components/gif";
import {
  EmptyMessage,
  ErrorMessage,
  GifGridSkeleton,
} from "../components/status";

const Category = () => {
  const { gf } = GifState();
  const { category } = useParams();

  const {
    status,
    data: results,
    retry,
    retryAt,
  } = useGiphy(`category:${category}`, () => gf.gifs(category, category));

  return (
    <div className="flex flex-col sm:flex-row gap-5 my-4">
      <div className="w-full sm:w-72 shrink-0">
        {status === "success" && results.length > 0 && <Gif gif={results[0]} />}
        <span className="text-gray-400 text-sm pt-2">
          Don&apos;t tell it to me, GIF it to me!
        </span>
        <div className="w-full h-0.5 mt-6 bg-gray-800" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-4xl pb-1 font-extrabold capitalize">
          {category.split("-").join(" & ")} GIFs
        </h2>
        <p className="text-lg text-gray-400 pb-3 font-bold">@{category}</p>

        {status === "loading" && <GifGridSkeleton count={8} />}
        {status === "error" && (
          <ErrorMessage onRetry={retry} retryAt={retryAt} />
        )}
        {status === "success" &&
          (results.length > 1 ? (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-2">
              {results.slice(1).map((gif) => (
                <Gif gif={gif} key={gif.id} />
              ))}
            </div>
          ) : (
            <EmptyMessage>No GIFs in this category yet.</EmptyMessage>
          ))}
      </div>
    </div>
  );
};

export default Category;
