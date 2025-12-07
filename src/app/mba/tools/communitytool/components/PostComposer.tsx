"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { createPost, type CommunityPost } from "@src/lib/community/client";

interface PostComposerProps {
  /**
   * Optional: pass a specific channelId (e.g. MBA general channel).
   * If not provided, and you pass onSubmit, the parent handles backend.
   */
  channelId?: string;

  /**
   * Optional: parent-handled submit. If provided, this is used
   * instead of the built-in createPost() call.
   */
  onSubmit?: (data: {
    title: string;
    body: string;
    imageUrl?: string | null;
  }) => Promise<void>;

  /**
   * Optional callback when a post is successfully created via backend.
   * Only used when onSubmit is NOT provided.
   */
  onCreated?: (post: CommunityPost) => void;
}

export default function PostComposer({
  channelId,
  onSubmit,
  onCreated,
}: PostComposerProps) {
  const { data: session } = useSession();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Image preview handler
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    let uploadedImageUrl: string | null = null;

    // TODO: Replace with your real upload API later
    if (image) {
      uploadedImageUrl = imagePreview; // temporary local preview
    }

    try {
      // If parent gave us an onSubmit, let parent handle backend
      if (onSubmit) {
        await onSubmit({
          title: title.trim(),
          body: body.trim(),
          imageUrl: uploadedImageUrl,
        });
      } else {
        // Built-in backend wiring using createPost()
        const authorId = session?.user?.email as string | undefined;

        if (!authorId) {
          setErrorMsg("Please sign in to create a post.");
          return;
        }

        if (!channelId) {
          setErrorMsg("Channel is not configured for this composer.");
          return;
        }

        const post = await createPost({
          title: title.trim(),
          body: body.trim(),
          imageUrl: uploadedImageUrl,
          channelId,
          authorId,
        });

        onCreated?.(post);
      }

      // Reset form on success
      setTitle("");
      setBody("");
      setImage(null);
      setImagePreview(null);
    } catch (err: any) {
      console.error("[PostComposer] submit failed:", err);
      setErrorMsg(err?.message || "Failed to create post.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="
        bg-white 
        border border-slate-200 
        rounded-xl 
        shadow-sm 
        p-5 
        mb-6
      "
    >
      {/* Heading */}
      <h3 className="text-lg font-semibold text-[#0a1b3f] mb-4">
        Create a Post
      </h3>

      {errorMsg && (
        <p className="mb-3 text-xs text-red-600">{errorMsg}</p>
      )}

      {/* Title */}
      <input
        type="text"
        placeholder="Post Title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="
          w-full
          px-4 py-2
          border border-slate-300
          rounded-lg
          mb-3
          text-sm
          focus:outline-none
          focus:ring-2 focus:ring-blue-600
        "
      />

      {/* Body */}
      <textarea
        placeholder="Write something meaningful..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="
          w-full
          px-4 py-2
          border border-slate-300
          rounded-lg
          text-sm
          h-28
          mb-3
          resize-none
          focus:outline-none
          focus:ring-2 focus:ring-blue-600
        "
      />

      {/* Image Upload */}
      <div className="mb-4">
        <label className="cursor-pointer text-blue-600 hover:underline text-sm">
          Upload Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>
      </div>

      {/* Preview */}
      {imagePreview && (
        <div className="mb-4 rounded-xl overflow-hidden border border-slate-200">
          <Image
            src={imagePreview}
            alt="Upload Preview"
            width={800}
            height={600}
            className="rounded-xl object-cover"
          />
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="
          bg-blue-900 
          text-white 
          px-5 py-2 
          rounded-lg 
          text-sm 
          font-medium 
          hover:bg-blue-800 
          transition
          disabled:opacity-60
        "
      >
        {loading ? "Posting..." : "Post"}
      </button>
    </div>
  );
}
