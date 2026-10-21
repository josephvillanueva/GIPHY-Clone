/* eslint-disable react/prop-types */

import { GiphyFetch } from "@giphy/js-fetch-api";
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createFavoritesStore } from "../lib/favorites-store";
import { supabase } from "../lib/supabase";

const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_KEY);
const GifContext = createContext(null);

const GifProvider = ({ children }) => {
  const [filter, setFilter] = useState("gifs");
  const [store] = useState(() => {
    let storage;
    try { storage = window.localStorage; } catch { /* Storage may be disabled. */ }
    return createFavoritesStore(supabase, storage);
  });
  const account = useSyncExternalStore(store.subscribe, store.getSnapshot);
  useEffect(() => {
    const stop = store.start();
    const retry = () => { void store.retrySync(); };
    const onVisible = () => { if (document.visibilityState === "visible") retry(); };
    window.addEventListener("online", retry);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop();
      window.removeEventListener("online", retry);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [store]);

  const value = useMemo(() => ({
    gf, filter, setFilter, ...account,
    toggleFavorite: store.toggleFavorite, importFavorites: store.importFavorites,
    retrySync: store.retrySync, signIn: store.signIn, signOut: store.signOut,
  }), [filter, account, store]);
  return <GifContext.Provider value={value}>{children}</GifContext.Provider>;
};

export const GifState = () => {
  const context = useContext(GifContext);
  if (!context) throw new Error("GifState must be used inside GifProvider");
  return context;
};

export default GifProvider;
