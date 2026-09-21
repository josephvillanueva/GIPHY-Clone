/* eslint-disable react/prop-types */

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GifState } from "../context/gif-context";
import { useGiphy } from "../hooks/use-giphy";
import Gif from "../components/gif";
import { ErrorMessage, GifGridSkeleton } from "../components/status";

import { HiOutlineExternalLink } from "react-icons/hi";
import {
  HiMiniChevronDown,
  HiMiniChevronUp,
  HiMiniHeart,
} from "react-icons/hi2";
import { FaPaperPlane } from "react-icons/fa6";
import { IoCodeSharp } from "react-icons/io5";

const CONTENT_TYPES = ["gifs", "stickers", "texts"];

const GifPage = () => {
  const { type, slug } = useParams();

  // An unknown type used to throw inside an effect and take the whole app
  // down. Render a message instead.
  if (!CONTENT_TYPES.includes(type)) {
    return (
      <div className="my-16 text-center">
        <h2 className="text-3xl font-extrabold">
          That page doesn&apos;t exist
        </h2>
        <Link to="/" className="mt-4 inline-block underline">
          Back to trending
        </Link>
      </div>
    );
  }

  // Keyed by slug so this route remounts when a related GIF is opened; the
  // old version fetched once and kept showing the first GIF.
  return <GifDetail key={slug} slug={slug} />;
};

const GifDetail = ({ slug }) => {
  const { gf, toggleFavorite, favorites } = GifState();
  const [readMore, setReadMore] = useState(false);
  const [copied, setCopied] = useState(null);
  const id = slug.split("-").pop();

  const { status, data, retry, retryAt } = useGiphy(
    `gif:${id}`,
    async () => {
      const [{ data: gif }, { data: related }] = await Promise.all([
        gf.gif(id),
        gf.related(id, { limit: 10 }),
      ]);
      return { data: { gif, related } };
    },
    null,
  );

  if (status === "loading") {
    return (
      <div className="my-10">
        <GifGridSkeleton count={4} />
      </div>
    );
  }
  if (status === "error")
    return <ErrorMessage onRetry={retry} retryAt={retryAt} />;

  const { gif, related } = data;
  const isFavorite = favorites.includes(gif.id);
  const description = gif.user?.description;

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copy this:", text);
    }
  };

  const shareGif = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: gif.title, url });
      } catch {
        // The user dismissed the share sheet.
      }
      return;
    }
    copyToClipboard(url, "share");
  };

  const copyEmbed = () => {
    if (!gif.embed_url) return;
    copyToClipboard(
      `<iframe src="${gif.embed_url}" width="480" height="270" frameborder="0" allowfullscreen></iframe>`,
      "embed",
    );
  };

  const favoriteButton = (
    <button
      type="button"
      onClick={() => toggleFavorite(gif.id)}
      aria-pressed={isFavorite}
      className="flex gap-5 items-center font-bold text-lg"
    >
      <HiMiniHeart
        size={30}
        aria-hidden="true"
        className={isFavorite ? "text-red-500" : ""}
      />
      {isFavorite ? "Favorited" : "Favorite"}
    </button>
  );

  return (
    <div className="grid grid-cols-4 my-10 gap-4">
      <aside className="hidden sm:block">
        {gif.user && (
          <>
            <div className="flex gap-1">
              <img
                src={gif.user.avatar_url}
                alt=""
                className="h-14"
                loading="lazy"
              />
              <div className="px-2">
                <div className="font-bold">{gif.user.display_name}</div>
                <div className="faded-text">@{gif.user.username}</div>
              </div>
            </div>
            {description && (
              <div className="py-4 text-sm text-gray-400">
                <p className="whitespace-pre-line">
                  {readMore || description.length <= 100
                    ? description
                    : `${description.slice(0, 100)}...`}
                </p>
                {description.length > 100 && (
                  <button
                    type="button"
                    className="flex items-center faded-text mt-1"
                    onClick={() => setReadMore((v) => !v)}
                    aria-expanded={readMore}
                  >
                    {readMore ? "Read less" : "Read more"}
                    {readMore ? (
                      <HiMiniChevronUp size={20} aria-hidden="true" />
                    ) : (
                      <HiMiniChevronDown size={20} aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        <div className="divider" />

        {gif.source && (
          <div>
            <span className="faded-text">Source</span>
            <div className="flex items-center text-sm font-bold gap-1">
              <HiOutlineExternalLink size={25} aria-hidden="true" />
              <a
                href={gif.source}
                target="_blank"
                rel="noreferrer"
                className="truncate"
              >
                {gif.source}
              </a>
            </div>
          </div>
        )}
      </aside>

      <div className="col-span-4 sm:col-span-3">
        <div className="flex gap-6">
          <div className="w-full sm:w-3/4">
            <h2 className="faded-text truncate mb-2">{gif.title}</h2>
            <Gif gif={gif} hover={false} />

            <div className="flex sm:hidden gap-4 items-center mt-2">
              {favoriteButton}
              <button
                type="button"
                className="ml-auto"
                onClick={shareGif}
                aria-label="Share this GIF"
              >
                <FaPaperPlane size={25} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="hidden sm:flex flex-col gap-5 mt-6">
            {favoriteButton}
            <button
              type="button"
              onClick={shareGif}
              className="flex gap-6 items-center font-bold text-lg"
            >
              <FaPaperPlane size={25} aria-hidden="true" />
              {copied === "share" ? "Link copied" : "Share"}
            </button>
            <button
              type="button"
              onClick={copyEmbed}
              className="flex gap-5 items-center font-bold text-lg"
            >
              <IoCodeSharp size={30} aria-hidden="true" />
              {copied === "embed" ? "Embed code copied" : "Embed"}
            </button>
          </div>
        </div>

        {related.length > 1 && (
          <section className="mt-6">
            <h3 className="font-extrabold">Related GIFs</h3>
            <div className="columns-2 md:columns-3 gap-2">
              {related.slice(1).map((relatedGif) => (
                <Gif gif={relatedGif} key={relatedGif.id} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default GifPage;
