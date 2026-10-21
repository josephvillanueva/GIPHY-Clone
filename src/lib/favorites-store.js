import { mergeFavorites, normalizeFavorites } from "./favorites.js";

const GUEST_KEY = "favoriteGIFs";
const accountKey = (id) => `accountFavorites:${id}`;
const PAGE_SIZE = 1000;

function read(storage, key, fallback) {
  try { return JSON.parse(storage?.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function write(storage, key, value) {
  try { storage?.setItem(key, JSON.stringify(value)); }
  catch { /* Private mode or quota: keep working in memory. */ }
}

function overlay(ids, pending) {
  let result = normalizeFavorites(ids);
  for (const [id, entry] of Object.entries(pending)) {
    result = entry.present ? mergeFavorites(result, [id]) : result.filter((value) => value !== id);
  }
  return result;
}

// The store keeps guest favorites, per-account caches, and pending changes
// separate. Only per-ID operations are uploaded, never a whole-list replace,
// so another device's additions cannot be deleted by a stale local cache.
export function createFavoritesStore(client, storage) {
  let guest = normalizeFavorites(read(storage, GUEST_KEY, []));
  let pending = {};
  let generation = 0;
  let running = null;
  let stopped = false;
  const listeners = new Set();
  let state = {
    favorites: guest, user: null, authLoading: Boolean(client),
    syncStatus: "local", syncError: null, configured: Boolean(client),
  };

  const emit = (changes) => {
    state = { ...state, ...changes };
    listeners.forEach((listener) => listener());
  };
  const saveAccount = () => {
    if (state.user) write(storage, accountKey(state.user.id), { ids: state.favorites, pending });
  };
  const current = (user, version) => !stopped && version === generation && state.user?.id === user.id;

  async function sync() {
    if (!state.user || stopped) return;
    if (running) return running;
    const user = state.user;
    const version = generation;
    emit({ syncStatus: "syncing", syncError: null });

    const task = (async () => {
      try {
        // Consume guest favorites only after they have reached the account.
        // Failed merges remain on the device and can be retried safely.
        const toMerge = [...guest];
        if (toMerge.length) {
          for (let offset = 0; offset < toMerge.length; offset += PAGE_SIZE) {
            if (!current(user, version)) return;
            const { error } = await client.from("favorites").upsert(
              toMerge.slice(offset, offset + PAGE_SIZE).map((gif_id) => ({ user_id: user.id, gif_id })),
              { onConflict: "user_id,gif_id", ignoreDuplicates: true },
            );
            if (error) throw error;
          }
          if (!current(user, version)) return;
          guest = guest.filter((id) => !toMerge.includes(id));
          write(storage, GUEST_KEY, guest);
        }

        // New changes made during an upload stay in pending for the next pass.
        while (Object.keys(pending).length) {
          const batch = Object.entries(pending).slice(0, PAGE_SIZE);
          for (const present of [true, false]) {
            const changes = batch.filter(([, entry]) => entry.present === present);
            if (!changes.length) continue;
            if (!current(user, version)) return;
            const query = client.from("favorites");
            const { error } = present
              ? await query.upsert(changes.map(([gif_id]) => ({ user_id: user.id, gif_id })),
                  { onConflict: "user_id,gif_id", ignoreDuplicates: true })
              : await query.delete().eq("user_id", user.id).in("gif_id", changes.map(([id]) => id));
            if (error) throw error;
            if (!current(user, version)) return;
            for (const [id, entry] of changes) {
              if (pending[id] === entry) delete pending[id];
            }
            saveAccount();
          }
        }

        // Explicit ordering and paging avoid silently truncating at the
        // server's default 1,000-row response limit.
        const remote = [];
        for (let offset = 0; ; offset += PAGE_SIZE) {
          if (!current(user, version)) return;
          const { data, error } = await client.from("favorites").select("gif_id")
            .eq("user_id", user.id).order("gif_id").range(offset, offset + PAGE_SIZE - 1);
          if (error) throw error;
          remote.push(...data.map((row) => row.gif_id));
          if (data.length < PAGE_SIZE) break;
        }
        if (!current(user, version)) return;
        emit({ favorites: overlay(remote, pending), syncStatus: "synced", syncError: null });
        saveAccount();
      } catch {
        if (current(user, version)) {
          emit({ syncStatus: "error", syncError: "Favorites could not sync. Your changes are kept on this device. Retry when you are online." });
          saveAccount();
        }
      }
    })();
    running = task;
    await task;
    if (running === task) {
      running = null;
      // A toggle during the final read must also be uploaded.
      if (current(user, version) && state.syncStatus !== "error" && Object.keys(pending).length) void sync();
    }
  }

  function sessionChanged(session) {
    const user = session?.user ?? null;
    if (state.user?.id === user?.id && !state.authLoading) return;
    generation += 1;
    running = null;
    pending = {};
    if (user) {
      const cached = read(storage, accountKey(user.id), {});
      for (const [id, value] of Object.entries(cached.pending ?? {})) {
        if (normalizeFavorites([id]).length && typeof value?.present === "boolean") pending[id] = value;
      }
      emit({ user, authLoading: false, favorites: overlay(mergeFavorites(cached.ids, guest), pending), syncStatus: "syncing", syncError: null });
      // Never call another Supabase method inside onAuthStateChange's lock.
      queueMicrotask(() => { if (state.user?.id === user.id && !stopped) void sync(); });
    } else {
      emit({ user: null, authLoading: false, favorites: guest, syncStatus: "local", syncError: null });
    }
  }

  function change(ids, present) {
    const valid = normalizeFavorites(ids);
    if (!valid.length || state.authLoading) return;
    if (state.user) {
      for (const id of valid) pending[id] = { present };
      emit({ favorites: overlay(state.favorites, pending) });
      saveAccount();
      void sync();
    } else {
      guest = present ? mergeFavorites(guest, valid) : guest.filter((id) => !valid.includes(id));
      write(storage, GUEST_KEY, guest);
      emit({ favorites: guest });
    }
  }

  return {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    getSnapshot: () => state,
    toggleFavorite(id) { change([id], !state.favorites.includes(id)); },
    importFavorites(ids) { change(ids, true); },
    retrySync: sync,
    async signIn(email, redirectTo) {
      if (!client) throw new Error("Account sync is not available yet.");
      const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
      if (error) throw error;
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw error;
      sessionChanged(null);
    },
    start() {
      stopped = false;
      if (!client) return () => {};
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        if (!stopped) sessionChanged(session);
      });
      const version = generation;
      // The initial callback handles normal startup. getSession additionally
      // reports invalid or expired link errors without an unhandled rejection.
      void client.auth.getSession().then(({ data, error }) => {
        if (stopped || version !== generation) return;
        if (error) emit({ authLoading: false, syncError: "Sign-in failed. Request a new email link and try again." });
        else sessionChanged(data.session);
      }).catch(() => {
        if (!stopped && version === generation) emit({ authLoading: false, syncError: "Sign-in is temporarily unavailable. Please try again." });
      });
      return () => { stopped = true; generation += 1; running = null; subscription.unsubscribe(); };
    },
  };
}
