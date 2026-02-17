"use client";

import { Bookmark } from "@/lib/types";
import { useState } from "react";

interface BookmarkItemProps {
  bookmark: Bookmark;
  onDelete: (id: string) => Promise<void>;
}

export default function BookmarkItem({ bookmark, onDelete }: BookmarkItemProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(bookmark.id);
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const faviconUrl = getFaviconUrl(bookmark.url);

  return (
    <div
      className={`group flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-200 ${
        deleting ? "opacity-50 scale-95" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          {faviconUrl ? (
            <img
              src={faviconUrl}
              alt=""
              className="w-5 h-5"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate block"
          >
            {bookmark.title}
          </a>
          <div className="flex items-center gap-2 mt-0.5">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-indigo-500 truncate max-w-[300px] transition-colors"
            >
              {bookmark.url}
            </a>
            <span className="text-xs text-gray-300 dark:text-gray-600 hidden sm:inline">
              •
            </span>
            <span className="text-xs text-gray-400 hidden sm:inline whitespace-nowrap">
              {formatDate(bookmark.created_at)}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="shrink-0 ml-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:cursor-not-allowed cursor-pointer"
        title="Delete bookmark"
      >
        {deleting ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
