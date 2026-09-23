import { useEffect, useState } from "react";
import { HiEllipsisVertical, HiMiniBars3BottomRight } from "react-icons/hi2";
import { Link } from "react-router-dom";
import { GifState } from "../context/gif-context";
import GifSearch from "./gif-search";

const Header = () => {
  const [categories, setCategories] = useState([]);
  const [showCategories, setShowCategories] = useState(false);

  const { favorites } = GifState();

  useEffect(() => {
    let active = true;
    fetch("/categories.json")
      .then((res) => res.json())
      .then(({ data }) => {
        if (active) setCategories(data);
      })
      .catch((error) => console.error("Could not load categories", error));
    return () => {
      active = false;
    };
  }, []);

  return (
    <nav>
      <div className="relative flex gap-4 justify-between items-center mb-2">
        <Link to={"/"} className="flex gap-2">
          <img src="/logo.svg" alt="Giphy Logo" className="w-8" />
          <h1 className="text-5xl font-bold tracking-tight cursor-pointer">
            GIPHY
          </h1>
        </Link>

        <div className="font-bold text-md flex gap-2 items-center">
          {categories?.slice(0, 5).map((category) => {
            return (
              <Link
                className="px-4 py-1 transition ease-in-out hover:gradient border-b-4 hidden lg:block"
                key={category.name}
                to={`/${category.name_encoded}`}
              >
                {category.name}
              </Link>
            );
          })}

          <button
            type="button"
            className="hidden lg:block"
            onClick={() => setShowCategories((v) => !v)}
            aria-expanded={showCategories}
            aria-controls="category-menu"
            aria-label="All categories"
          >
            <HiEllipsisVertical
              size={35}
              aria-hidden="true"
              className={`py-0.5 transition ease-in-out hover:gradient ${
                showCategories ? "gradient" : ""
              } border-b-4`}
            />
          </button>

          {favorites.length > 0 && (
            <Link
              to="/favorites"
              className="h-9 bg-gray-700 pt-1.5 px-6 rounded-sm whitespace-nowrap"
            >
              Favorite GIFs
            </Link>
          )}

          <button
            type="button"
            className="block lg:hidden"
            onClick={() => setShowCategories((v) => !v)}
            aria-expanded={showCategories}
            aria-controls="category-menu"
            aria-label="Categories menu"
          >
            <HiMiniBars3BottomRight
              className="text-sky-400"
              size={30}
              aria-hidden="true"
            />
          </button>
        </div>

        {showCategories && (
          <div
            id="category-menu"
            className="absolute right-0 top-14 px-10 pt-6 pb-9 w-full gradient z-20"
          >
            <span className="text-3xl font-extrabold">Categories</span>
            <hr className="bg-gray-100 opacity-50 my-5" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {categories?.map((category) => {
                return (
                  <Link
                    onClick={() => setShowCategories(false)}
                    className="transition ease-in-out font-bold"
                    key={category.name}
                    to={`/${category.name_encoded}`}
                  >
                    {category.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <GifSearch />
    </nav>
  );
};

export default Header;
