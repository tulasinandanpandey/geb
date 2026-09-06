"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Camera, Loader2, Upload, User, X } from "lucide-react";

interface ProfileImageUploaderProps {
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ProfileImageUploader({
  currentUrl = "",
  onUploadComplete,
}: ProfileImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [preview, setPreview] = useState<string>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please select a valid image file (JPG, PNG, or WEBP).");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image size must be smaller than 5 MB.");
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/uploads/profile-image`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to upload image.");
      }

      if (data.url) {
        setPreview(data.url);
        onUploadComplete(data.url);
      }
    } catch (err) {
      console.error("Profile image upload error:", err);
      // Fallback: use data URL preview if backend is unreachable
      onUploadComplete(localPreview);
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setPreview("");
    onUploadComplete("");
    setError("");
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-[var(--paper)] border border-[var(--stone-line)]">
      {/* Avatar Preview */}
      <div className="relative group shrink-0">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--copper-500)] shadow-md bg-[var(--stone-line)] flex items-center justify-center">
          {preview ? (
            <img
              src={preview}
              alt="Profile Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-[var(--ink-soft)] opacity-60" />
          )}
        </div>

        {preview && (
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow transition"
            title="Remove photo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Upload Actions */}
      <div className="flex-1 text-center sm:text-left space-y-2">
        <div>
          <h4 className="text-sm font-bold text-[var(--ink)]">Profile Photo / Avatar</h4>
          <p className="text-xs text-[var(--ink-soft)]">
            Upload your professional photo to display on your engineer/dealer profile card.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-xl bg-[var(--ink)] hover:bg-[var(--copper-700)] text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>{preview ? "Change Photo" : "Upload Photo"}</span>
              </>
            )}
          </button>

          {preview && (
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              ✓ Photo Attached
            </span>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {error && (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
