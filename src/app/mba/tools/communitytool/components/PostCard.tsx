"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";

export type PostCardPost = {
  _id: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  authorName: string;
  authorAvatar?: string | null;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  channelName?: string;
  isMine?: boolean;
  authorId?: string; // optional, if you want strict ownership check
};

interface PostCardProps {
  post: PostCardPost;
  onUpvote?: (id: string) => void;
  onDownvote?: (id: string) => void;
  onCommentClick?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function PostCard({
  post,
  onUpvote,
  onDownvote,
  onCommentClick,
  onDelete,
}: PostCardProps) {
  const { data: session } = useSession();

  // ✅ Use email as user identifier (no `.id` anymore)
  const currentUserId = session?.user?.email as string | undefined;

  const isOwner =
    post.isMine ||
    (post.authorId && currentUserId && post.authorId === currentUserId);

  const netScore = post.upvotes - post.downvotes;

  return (
    <article
      className="
        bg-white 
        border border-slate-200 
        shadow-sm 
        rounded-xl 
        p-5 
        hover:shadow-md 
        transition 
        duration-200
      "
    >
      {/* HEADER: author + meta */}
      <header className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {post.authorAvatar ? (
            <Image
              src={post.authorAvatar}
              alt={post.authorName}
              width={36}
              height={36}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
              {post.authorName?.charAt(0)?.toUpperCase() || "A"}
            </div>
          )}

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[#0a1b3f]">
              {post.authorName}
            </span>
            <span className="text-[11px] text-slate-500">
              {post.channelName ? `${post.channelName} • ` : ""}
              {new Date(post.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {isOwner && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(post._id)}
            className="text-[11px] px-2 py-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition"
          >
            Delete
          </button>
        )}
      </header>

      {/* TITLE */}
      <h2 className="text-lg font-semibold text-[#0a1b3f] mb-2">
        {post.title}
      </h2>

      {/* BODY */}
      <p className="text-slate-700 text-sm leading-relaxed mb-4 whitespace-pre-line">
        {post.body}
      </p>

      {/* IMAGE (optional) */}
      {post.imageUrl && (
        <div className="w-full rounded-xl overflow-hidden mb-4">
          <Image
            src={post.imageUrl}
            alt="Post image"
            width={900}
            height={600}
            className="object-cover rounded-xl"
          />
        </div>
      )}

      {/* FOOTER: votes + comments */}
      <footer className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-3 text-xs text-slate-600">
          {/* Upvote / Score / Downvote */}
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
            <button
              type="button"
              onClick={() => onUpvote?.(post._id)}
              className="px-1 hover:text-green-700"
            >
              ⬆
            </button>
            <span className="text-[11px] font-semibold min-w-[2rem] text-center">
              {netScore}
            </span>
            <button
              type="button"
              onClick={() => onDownvote?.(post._id)}
              className="px-1 hover:text-red-700"
            >
              ⬇
            </button>
          </div>

          {/* Comment button */}
          <button
            type="button"
            onClick={() => onCommentClick?.(post._id)}
            className="inline-flex items-center gap-1 hover:text-blue-700 transition"
          >
            <span>💬</span>
            <span>{post.commentCount}</span>
          </button>
        </div>

        {/* Created at (short) */}
        <span className="text-[11px] text-slate-400">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </footer>
    </article>
  );
}
