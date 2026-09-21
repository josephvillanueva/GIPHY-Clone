# Product brief: GIPHY Clone

## Problem

A study in rebuilding a familiar consumer product: which parts of GIPHY carry the experience, and what's the smallest version that still feels like the real thing?

## Who it's for

People looking for a reaction GIF to drop into a chat. They arrive with a feeling ("excited", "facepalm") or a topic, and want the right GIF in seconds.

## What v1 does

- Trending feed on arrival
- Search, with a GIFs / Stickers / Text filter that carries across pages
- Category browsing
- GIF detail pages with related GIFs, share and embed
- Favorites that persist in the browser

## Key decisions

| Decision | Why |
| --- | --- |
| Trending as the landing page | Most sessions start without a specific query, so show something worth clicking immediately |
| Favorites in `localStorage`, no accounts | Delivers the "save it for later" value with zero sign-up friction. Cross-device sync is deferred until it's shown to matter. |
| Store favorite IDs, not GIF objects | Saved items are fetched fresh, so they never go stale, and storage stays small |
| Native share sheet, with copy-link as a fallback | On mobile, where sharing happens, the OS share sheet reaches every chat app with one tap |

## Out of scope for now

Uploading GIFs, user profiles, GIF creation tools.

## How I'd measure success

- **Time to first share or copy:** the core job is "find a GIF and send it"
- **Search refinement rate:** how often users search again right away, a sign the first results missed
- **Favorites return rate:** whether saved GIFs actually get reused

## What's next

The prioritized backlog is on the [v1.1 milestone](https://github.com/josephvillanueva/GIPHY-Clone/milestone/1). Fixing the invalid-URL crash comes first, because shared links that dead-end break the core share loop.
