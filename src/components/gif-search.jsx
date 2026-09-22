import { useState } from "react";
import { HiMiniXMark, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

const GifSearch = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // A real form, so pressing Enter searches. The query is encoded so terms
  // containing "/", "#", or "?" do not break the route.
  const handleSubmit = (event) => {
    event.preventDefault();
    const term = query.trim();
    if (term) navigate(`/search/${encodeURIComponent(term)}`);
  };

  return (
    <form role="search" onSubmit={handleSubmit} className="flex relative">
      <label htmlFor="gif-search" className="sr-only">
        Search GIFs and stickers
      </label>
      <input
        id="gif-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search all the GIFs and Stickers"
        className="w-full bg-white pl-4 pr-14 py-5 text-xl text-black rounded-tl rounded-bl border border-gray-300 outline-hidden focus-visible:ring-4 focus-visible:ring-pink-400"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="absolute bg-gray-300 opacity-90 rounded-full right-20 mr-2 top-6 text-black"
        >
          <HiMiniXMark size={22} aria-hidden="true" />
        </button>
      )}
      <button
        type="submit"
        aria-label="Search"
        className="bg-linear-to-tr from-pink-600 to-pink-400 text-white px-4 py-2 rounded-tr rounded-br"
      >
        <HiOutlineMagnifyingGlass
          size={35}
          className="-scale-x-100"
          aria-hidden="true"
        />
      </button>
    </form>
  );
};

export default GifSearch;
