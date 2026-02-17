"use client";

import { createClient } from "@/lib/supabase/client";
import { Bookmark } from "@/lib/types";
import { useEffect, useState } from "react";
import BookmarkItem from "./BookmarkItem";

export default function BookmarkList() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchBookmarks = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bookmarks:", error);
      } else {
        setBookmarks(data || []);
      }
      setLoading(false);
    };

    fetchBookmarks();

    // Set up real-time subscription
    const channel = supabase
      .channel("bookmarks-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookmarks",
        },
        async (payload) => {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          // Only add if it belongs to the current user
          if (user && payload.new.user_id === user.id) {
            setBookmarks((prev) => {
              // Avoid duplicates
              if (prev.some((b) => b.id === payload.new.id)) return prev;
              return [payload.new as Bookmark, ...prev];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bookmarks",
        },
        (payload) => {
          setBookmarks((prev) =>
            prev.filter((b) => b.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (error) {
      console.error("Error deleting bookmark:", error);
    }
    // Optimistic update - remove immediately
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 mb-4">
          <svg
            className="w-8 h-8 text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
          No bookmarks yet
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Add your first bookmark using the form above!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
        {bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""} saved
      </p>
      <div className="grid gap-3">
        {bookmarks.map((bookmark) => (
          <BookmarkItem
            key={bookmark.id}
            bookmark={bookmark}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
