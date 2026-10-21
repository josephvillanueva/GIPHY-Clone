import { useState } from "react";
import { GifState } from "../context/gif-context";

export default function FavoritesAccount() {
  const { user, configured, authLoading, syncStatus, syncError, signIn, signOut, retrySync } = GifState();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function sendLink(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await signIn(email.trim(), new URL("/favorites", window.location.origin).href);
      setNotice("Check your email for a sign-in link. Open it on this device to sync your favorites.");
    } catch {
      setError("We could not send a sign-in link. Check your email address and try again in a minute.");
    } finally { setBusy(false); }
  }

  async function leaveAccount() {
    setBusy(true);
    setError("");
    setNotice("");
    try { await signOut(); }
    catch { setError("We could not sign you out. Please try again."); }
    finally { setBusy(false); }
  }

  return (
    <section aria-label="Account favorites" className="my-4 rounded border border-gray-600 p-4 space-y-3">
      <h3 className="font-bold">Keep favorites across devices</h3>
      {authLoading ? <p role="status">Checking your sign-in...</p> : user ? (
        <>
          <p>Signed in as {user.email}.</p>
          <p role="status">{syncStatus === "syncing" ? "Syncing favorites..." : syncStatus === "synced" ? "Favorites synced. Sign in on another device and refresh to see them there." : "Favorites are saved on this device while sync is unavailable."}</p>
          <div className="flex flex-wrap gap-4">
            <button type="button" onClick={() => void retrySync()} disabled={syncStatus === "syncing"}
              className="underline disabled:opacity-50">{syncStatus === "error" ? "Retry sync" : "Refresh favorites"}</button>
            <button type="button" onClick={leaveAccount} disabled={busy} className="underline disabled:opacity-50">Sign out</button>
          </div>
        </>
      ) : configured ? (
        <form onSubmit={sendLink} className="space-y-3">
          <p>Sign in by email to sync automatically. Your saved favorites from this browser will merge into your account without duplicates.</p>
          <label className="block">Email address
            <input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)}
              className="block w-full max-w-md rounded border border-gray-500 p-2 mt-1" />
          </label>
          <button type="submit" disabled={busy} className="rounded bg-purple-700 px-4 py-2 font-bold disabled:opacity-50">
            {busy ? "Sending link..." : "Email me a sign-in link"}
          </button>
        </form>
      ) : <p>Account sync is not available yet. You can still take favorites to another device with a link below.</p>}
      {notice && !user && <p role="status">{notice}</p>}
      {(error || syncError) && <p role="alert" className="text-red-300">{error || syncError}</p>}
    </section>
  );
}
