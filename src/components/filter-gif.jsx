/* eslint-disable react/prop-types */

import { HiMiniArrowTrendingUp } from "react-icons/hi2";
import { GifState } from "../context/gif-context";

const filters = [
  {
    title: "GIFs",
    value: "gifs",
    background:
      "bg-linear-to-tr from-purple-500 via-purple-600 to-purple-500",
  },
  {
    title: "Stickers",
    value: "stickers",
    background: "bg-linear-to-tr from-teal-500 via-teal-600 to-teal-500",
  },
  {
    title: "Text",
    value: "text",
    background: "bg-linear-to-tr from-blue-500 via-blue-600 to-blue-500",
  },
];

const FilterGif = ({ alignLeft = false, showTrending = false }) => {
  const { filter, setFilter } = GifState();

  return (
    <div
      className={`flex my-3 gap-3 ${alignLeft ? "" : "justify-end"} ${
        showTrending
          ? "flex-col sm:flex-row sm:items-center justify-between "
          : ""
      }`}
    >
      {showTrending && (
        <span className="flex gap-2">
          <HiMiniArrowTrendingUp
            size={25}
            className="text-teal-400"
            aria-hidden="true"
          />
          <span className="font-semibold text-gray-400">Trending</span>
        </span>
      )}
      {/* Buttons rather than clickable spans, so the filter works by keyboard. */}
      <div
        className="flex min-w-80 rounded-full bg-gray-800"
        role="group"
        aria-label="Content type"
      >
        {filters.map((f) => (
          <button
            type="button"
            key={f.value}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`${
              filter === f.value ? f.background : ""
            } font-semibold py-2 w-1/3 text-center rounded-full focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-white`}
          >
            {f.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterGif;
