"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import PostCard from "./PostCard";
import {
  fetchPosts,
  type CommunityPost,
} from "@src/lib/community/client";

type FilterType = "latest" | "trending" | "mine";

type FeedPost = {
  _id: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  authorName: string;
  authorAvatar?: string | null;
  createdAt: string;
  likeCount: number;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  channelName?: string;
  isMine?: boolean;
};

export default function PostFeed() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.email ?? "";

  const [filter, setFilter] = useState<FilterType>("latest");
  const [posts, setPosts] = useState<FeedPost[]>([]); // ✅ Start with empty array
  const [loading, setLoading] = useState(true); // ✅ Start with loading=true
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const options: {
          sort?: "latest" | "trending";
          mine?: boolean;
          authorId?: string;
        } = {};

        if (filter === "trending") {
          options.sort = "trending";
        } else {
          options.sort = "latest";
        }

        if (filter === "mine" && currentUserId) {
          options.mine = true;
          options.authorId = currentUserId;
        }

        // ✅ Pass abort signal (you'll need to update client.ts)
        const apiPosts: CommunityPost[] = await fetchPosts(options);

        const mapped: FeedPost[] = apiPosts.map((p) => {
          const upvotes = p.upvotes ?? p.likeCount ?? 0;
          const downvotes = p.downvotes ?? 0;
          const likeCount = upvotes;

          return {
            _id: p._id,
            title: p.title,
            body: p.body,
            imageUrl: p.imageUrl ?? null,
            authorName: "MBA Member",
            authorAvatar: "/avatars/default.png",
            createdAt: new Date(p.createdAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
            }),
            likeCount,
            upvotes,
            downvotes,
            commentCount: p.commentCount ?? 0,
            channelName: "MBA Community",
            isMine:
              currentUserId && p.authorId === currentUserId ? true : false,
          };
        });

        setPosts(mapped);
      } catch (err: any) {
        // ✅ Ignore aborted requests
        if (err.name === 'AbortError') return;
        
        console.error("[PostFeed] Failed to load posts:", err);
        setError(
          err?.message || "Something went wrong while loading community posts."
        );
        setPosts([]); // ✅ Clear posts on error
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      abortController.abort();
    };
  }, [filter, currentUserId]);

  const filteredPosts = useMemo(() => {
    if (filter === "trending") {
      return [...posts].sort(
        (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
      );
    }
    return posts;
  }, [posts, filter]);

  const handleCommentClick = (id: string) => {
    console.log("[Community] Open comments for post:", id);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
      {/* HEADER + FILTERS */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-shrink-0">
            <h2 className="text-sm font-semibold text-[#002b5b]">
              Community Posts
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              See what other MBA aspirants are discussing right now.
            </p>
          </div>

          <div className="inline-flex items-center rounded-full bg-slate-100 p-1 flex-shrink-0">
            {(
              [
                { key: "latest", label: "Latest" },
                { key: "trending", label: "Trending" },
                { key: "mine", label: "My Posts" },
              ] as const
            ).map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={[
                    "px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap",
                    active
                      ? "bg-[#002b5b] text-white shadow-sm"
                      : "text-slate-700 hover:bg-white",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading && (
          <p className="mt-2 text-[11px] text-slate-500">Loading posts…</p>
        )}
        {error && (
          <p className="mt-2 text-[11px] text-red-500">{error}</p>
        )}
      </div>

      {/* FEED LIST */}
      <div className="px-4 pb-4 pt-3 space-y-4">
        {filteredPosts.length === 0 && !loading ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center">
            <p className="text-sm font-medium text-slate-700">
              {error ? "Failed to load posts" : "No posts here yet."}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {error
                ? "Please check your internet connection and try again."
                : "Be the first to create a post from the left panel!"}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onCommentClick={() => handleCommentClick(post._id)}
            />
          ))
        )}

        {filteredPosts.length > 0 && !loading && (
          <div className="pt-1 flex justify-center">
            <button
              type="button"
              className="text-xs rounded-full border border-slate-200 px-4 py-1.5 text-slate-600 hover:bg-slate-50"
              onClick={() => {
                alert("Pagination coming soon!");
              }}
            >
              Load more posts
            </button>
          </div>
        )}
      </div>
    </section>
  );
}