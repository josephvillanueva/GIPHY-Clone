import { useEffect, useState } from "react";
import { HiEllipsisVertical } from "react-icons/hi2";
import { Link } from "react-router-dom";

const Header = () => {
  const [categories, setCategories] = useState([]);
  const [showCategories, setShowCategories] = useState(false);

  const fetchGifCategories = async () => {
    const res = await fetch("/categories.json");
    const { data } = await res.json();
    setCategories(data);
  };

  useEffect(() => {
    fetchGifCategories();
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
          <Link>Reactions</Link>;
          <button onClick={() => setShowCategories(!showCategories)}>
            <HiEllipsisVertical
              size={35}
              className={`py-0.5 transition ease-in-out hover:gradient ${
                showCategories ? "gradient" : ""
              } border-b-4 cursor-pointer hidden lg:block`}
            />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
