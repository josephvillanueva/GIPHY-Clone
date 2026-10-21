// Transfer links are deliberately bounded. Reject invalid lists instead of
// silently dropping entries or sending arbitrary input to the GIPHY API.
export const MAX_TRANSFER_IDS = 1000;
const GIF_ID = /^[a-zA-Z0-9]{1,64}$/;

export function normalizeFavorites(value) {
  return Array.isArray(value)
    ? [...new Set(value.filter((id) => typeof id === "string" && GIF_ID.test(id)))]
    : [];
}

export function mergeFavorites(current, incoming) {
  return normalizeFavorites([...normalizeFavorites(current), ...normalizeFavorites(incoming)]);
}

export function readTransfer(search) {
  const params = new URLSearchParams(search);
  if (!params.has("ids")) return { ids: null, error: null };
  const values = params.getAll("ids");
  const ids = values[0].split(",");
  if (values.length !== 1 || ids.length > MAX_TRANSFER_IDS || ids.some((id) => !GIF_ID.test(id))) {
    return { ids: null, error: "This favorites link is invalid or too large. Ask for a new link." };
  }
  return { ids: [...new Set(ids)], error: null };
}

export function createTransferUrl(favorites, origin) {
  const ids = normalizeFavorites(favorites);
  if (!ids.length) throw new Error("Save a GIF before copying your favorites link.");
  if (ids.length > MAX_TRANSFER_IDS) {
    throw new Error(`A favorites link can contain up to ${MAX_TRANSFER_IDS} GIFs.`);
  }
  const url = new URL("/favorites", origin);
  url.searchParams.set("ids", ids.join(","));
  return url.href;
}

// GIPHY's IDs endpoint accepts at most 100 IDs per request.
export async function fetchFavorites(gf, ids) {
  const batches = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    batches.push(gf.gifs(ids.slice(offset, offset + 100)));
  }
  const responses = await Promise.all(batches);
  return { data: responses.flatMap((response) => response.data) };
}
