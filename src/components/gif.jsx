/* eslint-disable react/prop-types */

import { Link } from "react-router-dom";

const Gif = ({ gif, hover = true }) => {
  const still = gif?.images?.fixed_width;

  return (
    <Link
      to={`/${gif.type}s/${gif.slug}`}
      className="block rounded-sm focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-white"
    >
      <div className="w-full mb-2 relative bg-png-pattern cursor-pointer group">
        <img
          src={still?.webp}
          alt={gif?.title || "GIF"}
          width={still?.width}
          height={still?.height}
          loading="lazy"
          className="w-full h-auto object-cover rounded-sm transition-all duration-300"
        />
        {hover && gif?.user && (
          <div className="absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-b from-transparent via-transparent to-black font-bold flex items-end gap-2 p-2">
            <img
              src={gif.user.avatar_url}
              alt=""
              className="h-8"
              loading="lazy"
            />
            <span>{gif.user.display_name}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default Gif;
