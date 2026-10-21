import test from "node:test";
import assert from "node:assert/strict";
import { createFavoritesStore } from "../src/lib/favorites-store.js";
import { createTransferUrl, fetchFavorites, mergeFavorites, normalizeFavorites, readTransfer } from "../src/lib/favorites.js";

const userA = { id: "account-a", email: "a@example.test" };
const userB = { id: "account-b", email: "b@example.test" };
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function storage(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, JSON.stringify(value)]));
  return { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
}

function fakeClient() {
  let onAuth;
  let session = null;
  const rows = new Map();
  const client = {
    rows,
    fail: null,
    beforeRead: null,
    auth: {
      onAuthStateChange(fn) { onAuth = fn; return { data: { subscription: { unsubscribe() { onAuth = null; } } } }; },
      async getSession() { return { data: { session }, error: null }; },
      async signInWithOtp(args) { client.signInArgs = args; return { error: null }; },
      async signOut() { session = null; onAuth?.("SIGNED_OUT", null); return { error: null }; },
    },
    emit(user) { session = user ? { user } : null; onAuth?.("SIGNED_IN", session); },
    from(table) {
      assert.equal(table, "favorites");
      let action;
      let entries;
      let owner;
      let ids;
      let from = 0;
      let to = 999;
      const query = {
        upsert(value, options) {
          assert.deepEqual(options, { onConflict: "user_id,gif_id", ignoreDuplicates: true });
          action = "upsert"; entries = value; return query;
        },
        delete() { action = "delete"; return query; },
        select(value) { assert.equal(value, "gif_id"); action = "select"; return query; },
        eq(column, value) { assert.equal(column, "user_id"); owner = value; return query; },
        in(column, value) { assert.equal(column, "gif_id"); ids = value; return query; },
        order(column) { assert.equal(column, "gif_id"); return query; },
        range(start, end) { from = start; to = end; return query; },
        async then(resolve, reject) {
          try {
            if (client.fail === action) return resolve({ error: new Error("offline") });
            if (action === "select" && client.beforeRead) {
              const callback = client.beforeRead;
              client.beforeRead = null;
              await callback(owner);
            }
            if (action === "upsert") {
              for (const row of entries) {
                if (!rows.has(row.user_id)) rows.set(row.user_id, new Set());
                rows.get(row.user_id).add(row.gif_id);
              }
            } else if (action === "delete") {
              for (const id of ids) rows.get(owner)?.delete(id);
            }
            return resolve({ data: action === "select" ? [...(rows.get(owner) ?? [])].sort().slice(from, to + 1).map((gif_id) => ({ gif_id })) : null, error: null });
          } catch (error) { reject(error); }
        },
      };
      return query;
    },
  };
  return client;
}

async function signedIn(client, local = storage(), user = userA) {
  const store = createFavoritesStore(client, local);
  store.start();
  await tick();
  client.emit(user);
  await store.retrySync();
  return store;
}

test("signed-out favorites survive reload and normalize damaged storage", () => {
  const local = storage({ favoriteGIFs: ["abc", "abc", 4, "<script>", "def"] });
  const store = createFavoritesStore(null, local);
  assert.deepEqual(store.getSnapshot().favorites, ["abc", "def"]);
  store.toggleFavorite("abc");
  store.importFavorites(["new", "new", "def"]);
  assert.deepEqual(createFavoritesStore(null, local).getSnapshot().favorites, ["def", "new"]);
  assert.deepEqual(normalizeFavorites(null), []);
  assert.deepEqual(mergeFavorites(["a"], ["a", "b"]), ["a", "b"]);
});

test("first sign-in merges local IDs once and another device reads the account", async () => {
  const client = fakeClient();
  client.rows.set(userA.id, new Set(["remote", "duplicate"]));
  const local = storage({ favoriteGIFs: ["local", "duplicate"] });
  const store = await signedIn(client, local);
  assert.deepEqual(new Set(store.getSnapshot().favorites), new Set(["remote", "local", "duplicate"]));
  assert.deepEqual(JSON.parse(local.getItem("favoriteGIFs")), []);
  store.toggleFavorite("local");
  await store.retrySync();
  await store.signOut();
  assert.deepEqual(store.getSnapshot().favorites, []);
  client.emit(userA);
  await store.retrySync();
  assert.equal(store.getSnapshot().favorites.includes("local"), false, "removed imported IDs must not resurrect");

  const other = await signedIn(client);
  assert.deepEqual(new Set(other.getSnapshot().favorites), new Set(["remote", "duplicate"]));
});

test("failed merge preserves guest favorites until an acknowledged retry", async () => {
  const client = fakeClient();
  client.fail = "upsert";
  const local = storage({ favoriteGIFs: ["guest"] });
  const store = await signedIn(client, local);
  assert.equal(store.getSnapshot().syncStatus, "error");
  assert.deepEqual(JSON.parse(local.getItem("favoriteGIFs")), ["guest"]);
  client.fail = null;
  await store.retrySync();
  assert.deepEqual([...client.rows.get(userA.id)], ["guest"]);
  assert.deepEqual(JSON.parse(local.getItem("favoriteGIFs")), []);
});

test("offline deletions survive reload and retry without erasing other-device additions", async () => {
  const client = fakeClient();
  client.rows.set(userA.id, new Set(["remove", "keep"]));
  const local = storage();
  const store = await signedIn(client, local);
  client.fail = "delete";
  store.toggleFavorite("remove");
  await store.retrySync();
  assert.equal(store.getSnapshot().syncStatus, "error");
  client.rows.get(userA.id).add("otherDevice");
  client.fail = null;
  const reloaded = await signedIn(client, local);
  assert.deepEqual(new Set(reloaded.getSnapshot().favorites), new Set(["keep", "otherDevice"]));
  assert.equal(client.rows.get(userA.id).has("remove"), false);
});

test("toggle during final read is retained and uploaded on the next pass", async () => {
  const client = fakeClient();
  const store = await signedIn(client);
  client.beforeRead = async () => store.toggleFavorite("duringRead");
  await store.retrySync();
  await tick();
  await store.retrySync();
  assert.equal(client.rows.get(userA.id).has("duringRead"), true);
  assert.deepEqual(store.getSnapshot().favorites, ["duringRead"]);
});

test("switching accounts during a request discards the old response and hides private data", async () => {
  const client = fakeClient();
  client.rows.set(userA.id, new Set(["privateA"]));
  client.rows.set(userB.id, new Set(["privateB"]));
  const store = await signedIn(client);
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  client.beforeRead = async () => gate;
  const oldRead = store.retrySync();
  await tick();
  client.emit(userB);
  await store.retrySync();
  assert.deepEqual(store.getSnapshot().favorites, ["privateB"]);
  release();
  await oldRead;
  assert.deepEqual(store.getSnapshot().favorites, ["privateB"]);
  await store.signOut();
  assert.deepEqual(store.getSnapshot().favorites, []);
});

test("paged account reads fetch all saved IDs beyond the default row limit", async () => {
  const client = fakeClient();
  const ids = Array.from({ length: 1003 }, (_, i) => `gif${i}`);
  client.rows.set(userA.id, new Set(ids));
  const store = await signedIn(client);
  assert.equal(store.getSnapshot().favorites.length, 1003);
});

test("StrictMode start-stop-start restarts an abandoned authenticated sync", async () => {
  const client = fakeClient();
  client.rows.set(userA.id, new Set(["fromAccount"]));
  client.emit(userA);
  const store = createFavoritesStore(client, storage());
  const stop = store.start();
  await tick();
  stop();
  store.start();
  await tick();
  await store.retrySync();
  assert.equal(store.getSnapshot().syncStatus, "synced");
  assert.deepEqual(store.getSnapshot().favorites, ["fromAccount"]);
});

test("malformed account caches and blocked localStorage do not crash the app", async () => {
  const client = fakeClient();
  const local = storage({ [`accountFavorites:${userA.id}`]: { ids: null, pending: { a: null, b: { present: "no" } } } });
  const store = await signedIn(client, local);
  assert.deepEqual(store.getSnapshot().favorites, []);
  const blocked = { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } };
  const guest = createFavoritesStore(null, blocked);
  guest.toggleFavorite("works");
  assert.deepEqual(guest.getSnapshot().favorites, ["works"]);
});

test("magic-link request uses the supplied same-site redirect without sending real email", async () => {
  const client = fakeClient();
  const store = createFavoritesStore(client, storage());
  await store.signIn("user@example.test", "https://example.test/favorites");
  assert.deepEqual(client.signInArgs, { email: "user@example.test", options: { emailRedirectTo: "https://example.test/favorites" } });
});

test("transfer links round-trip unique IDs and reject malformed or excessive input", () => {
  const url = createTransferUrl(["abc", "def", "abc"], "https://example.test");
  assert.deepEqual(readTransfer(new URL(url).search), { ids: ["abc", "def"], error: null });
  for (const search of ["?ids=", "?ids=a,,b", "?ids=../bad", "?ids=a&ids=b", `?ids=${Array(1001).fill("a").join(",")}`]) {
    assert.ok(readTransfer(search).error);
    assert.equal(readTransfer(search).ids, null);
  }
  assert.deepEqual(readTransfer("?other=a"), { ids: null, error: null });
  assert.throws(() => createTransferUrl([], "https://example.test"));
});

test("GIPHY lookups batch requests and skip empty lists", async () => {
  const calls = [];
  const gf = { async gifs(ids) { calls.push(ids); return { data: ids.map((id) => ({ id })) }; } };
  assert.deepEqual(await fetchFavorites(gf, []), { data: [] });
  const ids = Array.from({ length: 205 }, (_, i) => `gif${i}`);
  assert.equal((await fetchFavorites(gf, ids)).data.length, 205);
  assert.deepEqual(calls.map((ids) => ids.length), [100, 100, 5]);
});
