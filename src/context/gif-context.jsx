/* eslint-disable react/prop-types */

import { GiphyFetch } from "@giphy/js-fetch-api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const FAVORITES_KEY = "favoriteGIFs";

// One client for the app's lifetime rather than a new one on every render.
const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_KEY);

// Read synchronously so the first render already has the saved favorites.
// Loading them in an effect left the Favorites page fetching an empty list
// on refresh.
function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

const GifContext = createContext(null);

const GifProvider = ({ children }) => {
  const [filter, setFilter] = useState("gifs");
  const [favorites, setFavorites] = useState(readFavorites);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // Storage unavailable (private mode or quota): keep favorites in memory.
    }
  }, [favorites]);

  const toggleFavorite = useCallback((id) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id],
    );
  }, []);

  const value = useMemo(
    () => ({ gf, filter, setFilter, favorites, toggleFavorite }),
    [filter, favorites, toggleFavorite],
  );

  return <GifContext.Provider value={value}>{children}</GifContext.Provider>;
};

export const GifState = () => {
  const context = useContext(GifContext);
  if (!context) throw new Error("GifState must be used inside GifProvider");
  return context;
};

export default GifProvider;
