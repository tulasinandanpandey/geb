"use client";

import {
  ChangeEvent,
  useRef,
  useState,
} from "react";

import {
  ImagePlus,
  Loader2,
  Upload,
  X,
} from "lucide-react";


interface PropertyImageUploaderProps {
  onUploadComplete: (
    urls: string[]
  ) => void;
}


const MAX_FILES = 10;

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";


export default function PropertyImageUploader({
  onUploadComplete,
}: PropertyImageUploaderProps) {

  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );


  const [files, setFiles] =
    useState<File[]>([]);

  const [previews, setPreviews] =
    useState<string[]>([]);

  const [uploadedUrls, setUploadedUrls] =
    useState<string[]>([]);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");


  /*
   * ==========================================================
   * SELECT FILES
   * ==========================================================
   */

  function handleFiles(
    event: ChangeEvent<HTMLInputElement>
  ) {

    setError("");


    const selectedFiles =
      Array.from(
        event.target.files || []
      );


    if (
      selectedFiles.length === 0
    ) {
      return;
    }


    if (
      files.length +
        selectedFiles.length >
      MAX_FILES
    ) {

      setError(
        `You can upload a maximum of ${MAX_FILES} photos.`
      );

      return;

    }


    const invalidFile =
      selectedFiles.find(
        (file) =>
          !ALLOWED_TYPES.includes(
            file.type
          ) ||
          file.size >
            MAX_FILE_SIZE
      );


    if (invalidFile) {

      setError(
        `${invalidFile.name} is invalid. Use JPG, PNG or WEBP under 5 MB.`
      );

      return;

    }


    const newFiles = [
      ...files,
      ...selectedFiles,
    ];


    const newPreviews =
      newFiles.map(
        (file) =>
          URL.createObjectURL(
            file
          )
      );


    previews.forEach(
      (url) =>
        URL.revokeObjectURL(
          url
        )
    );


    setFiles(newFiles);

    setPreviews(newPreviews);


    /*
     * Clear previously uploaded
     * URLs because files changed.
     */

    setUploadedUrls([]);

    onUploadComplete([]);

  }


  /*
   * ==========================================================
   * REMOVE FILE
   * ==========================================================
   */

  function removeFile(
    index: number
  ) {

    const newFiles =
      files.filter(
        (_, i) =>
          i !== index
      );


    const newPreviews =
      previews.filter(
        (_, i) =>
          i !== index
      );


    if (previews[index]) {

      URL.revokeObjectURL(
        previews[index]
      );

    }


    setFiles(newFiles);

    setPreviews(newPreviews);

    setUploadedUrls([]);

    onUploadComplete([]);

  }


  /*
   * ==========================================================
   * UPLOAD FILES
   * ==========================================================
   */

  async function uploadFiles() {

    if (
      files.length === 0
    ) {

      setError(
        "Please select at least one property photo."
      );

      return;

    }


    setError("");

    setUploading(true);


    try {

      const urls: string[] = [];


      for (
        const file of files
      ) {

        const formData =
          new FormData();


        formData.append(
          "file",
          file
        );


        const response =
          await fetch(
            `${API_URL}/api/uploads/property-image`,
            {
              method: "POST",
              body: formData,
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.detail ||
              `Failed to upload ${file.name}`
          );

        }


        urls.push(
          data.url
        );

      }


      setUploadedUrls(
        urls
      );


      onUploadComplete(
        urls
      );


    } catch (error) {

      console.error(
        "Property image upload failed:",
        error
      );


      setError(
        error instanceof Error
          ? error.message
          : "Unable to upload property photos."
      );

    } finally {

      setUploading(false);

    }

  }


  /*
   * ==========================================================
   * UI
   * ==========================================================
   */

  return (

    <div className="space-y-5">


      {/* UPLOAD AREA */}

      <button
        type="button"
        onClick={() =>
          inputRef.current?.click()
        }
        className="group w-full rounded-[1.5rem] border-2 border-dashed border-[var(--stone-line)] bg-[var(--paper)] px-6 py-10 text-center transition hover:border-[var(--ink-soft)] hover:bg-white"
      >

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm transition group-hover:scale-105">

          <ImagePlus
            size={24}
            className="text-[var(--ink-soft)]"
          />

        </div>


        <p className="mt-4 text-sm font-semibold">

          Add property photos

        </p>


        <p className="mt-1 text-xs text-[var(--ink-soft)]">

          JPG, PNG or WEBP · Maximum 5 MB each

        </p>


        <p className="mt-2 text-xs text-[var(--ink-soft)]">

          Up to {MAX_FILES} photos

        </p>

      </button>


      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFiles}
      />


      {/* PREVIEWS */}

      {files.length > 0 && (

        <div>

          <div className="mb-3 flex items-center justify-between">

            <p className="text-sm font-semibold">

              Selected photos

            </p>


            <p className="text-xs text-[var(--ink-soft)]">

              {files.length} / {MAX_FILES}

            </p>

          </div>


          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">

            {previews.map(
              (preview, index) => (

                <div
                  key={preview}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-[var(--paper)]"
                >

                  <img
                    src={preview}
                    alt={`Property photo ${index + 1}`}
                    className="h-full w-full object-cover"
                  />


                  {index === 0 && (

                    <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold shadow-sm">

                      COVER

                    </span>

                  )}


                  <button
                    type="button"
                    onClick={() =>
                      removeFile(index)
                    }
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[var(--ink-soft)] opacity-100 shadow-sm transition hover:bg-[var(--ink)] hover:text-white"
                  >

                    <X size={14} />

                  </button>

                </div>

              )
            )}

          </div>

        </div>

      )}


      {/* UPLOAD BUTTON */}

      {files.length > 0 &&
        uploadedUrls.length === 0 && (

          <button
            type="button"
            onClick={uploadFiles}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--stone-line)] bg-[var(--ink)] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--copper-700)] disabled:cursor-not-allowed disabled:opacity-50"
          >

            {uploading ? (

              <>

                <Loader2
                  size={17}
                  className="animate-spin"
                />

                Uploading photos...

              </>

            ) : (

              <>

                <Upload
                  size={17}
                />

                Upload {files.length} photo
                {files.length !== 1
                  ? "s"
                  : ""}

              </>

            )}

          </button>

        )}


      {/* SUCCESS */}

      {uploadedUrls.length > 0 && (

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">

          <p className="text-sm font-semibold text-emerald-800">

            ✓ {uploadedUrls.length} photos uploaded successfully

          </p>


          <p className="mt-1 text-xs text-emerald-600">

            Your photos are ready to be attached to this property.

          </p>

        </div>

      )}


      {/* ERROR */}

      {error && (

        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">

          {error}

        </div>

      )}

    </div>

  );

}
