# GIPHY Clone

A GIPHY-style app for browsing trending GIFs, searching GIFs, stickers, and text, and saving favorites.

**Live:** https://giphy-clone.vercel.app · **[Product brief](docs/PRODUCT.md)** · **[Roadmap](https://github.com/josephvillanueva/GIPHY-Clone/milestone/1)**

<!-- Add a screenshot: save one as public/screenshot.png and uncomment the line below -->
<!-- ![GIPHY Clone home page](public/screenshot.png) -->

## Features

- **Trending feed** on the home page
- **Search** with a GIFs / Stickers / Text filter that applies across pages
- **Category pages** at `/:category`
- **GIF detail pages** with related GIFs, plus share (native share sheet or copy link) and copy-embed-code
- **Favorites**, saved to `localStorage` so they survive a reload with no account needed
- Responsive layout for mobile and desktop

## Tech stack

- React 18 + Vite
- React Router (data router with a shared layout route)
- Tailwind CSS
- [`@giphy/js-fetch-api`](https://github.com/Giphy/giphy-js) for trending, search, category, and related-GIF requests

## How it's built

- **One shared context (`GifProvider`)** holds the GIPHY client, the active content-type filter, and favorites. The filter lives there so it carries over as you move between search, category, and home, without prop drilling.
- **Favorites store IDs, not GIF objects.** The Favorites page fetches the current data for those IDs in one batched `gf.gifs(ids)` call, so saved items never go stale and `localStorage` stays small.
- **Routes are nested under one layout**, so the header and search bar mount once and the pages swap underneath.
- **One data hook (`useGiphy`) for every page.** Each request is keyed by all of its inputs (query, filter, GIF ID), so moving between two searches or two GIFs on the same route always refetches, and a response from a superseded request is discarded. Every page gets the same loading skeleton, error message, and retry. The retry button waits out the SDK's six-second cache of failed requests, since retrying sooner would only return the cached failure.
- **Deep links work on Vercel.** `vercel.json` rewrites every path to `index.html`, so refreshing or sharing a search, category, or GIF URL loads the app instead of a 404.

## Architecture

![GIPHY Clone architecture: React Router renders pages that request data through the useGiphy hook and the GIPHY API, with favorites held in context and saved to localStorage](docs/architecture.svg)

## Running locally

Requires Node 20+ and a free [GIPHY API key](https://developers.giphy.com/).

```bash
git clone https://github.com/josephvillanueva/GIPHY-Clone.git
cd GIPHY-Clone
npm install
echo "VITE_GIPHY_KEY=your_key_here" > .env
npm run dev
```

## What I'd do next

- Infinite scroll on search and trending results
- Move favorites to a small backend so they sync across devices
