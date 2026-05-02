import { useState, useEffect, useRef, useCallback } from "react";
import { mediaApi } from "../../api/mediaApi";

const CATEGORY_PHOTO = "PHOTO";

export const MediaGallery = ({ group, user, category }) => {
    const [mediaItems, setMediaItems] = useState([]);
    const [blobs, setBlobs] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef(null);

    const isPhoto = category === CATEGORY_PHOTO;

    const fetchMedia = useCallback(async () => {
        if (!group?.id) return;
        setLoading(true);
        setError("");
        try {
            const response = await mediaApi.getGroupMedia(group.id);
            const items = (response?.items || response || []).filter(
                (item) => item.category === category
            );
            setMediaItems(items);

            const blobMap = {};
            await Promise.all(
                items.map(async (item) => {
                    try {
                        const url = await mediaApi.getMediaBlobUrl(item.file_url);
                        blobMap[item.id] = url;
                    } catch {
                        blobMap[item.id] = null;
                    }
                })
            );
            setBlobs(blobMap);
        } catch (err) {
            setError("Failed to load media");
        } finally {
            setLoading(false);
        }
    }, [group?.id, category]);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const handleFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setUploading(true);
        setError("");
        try {
            if (isPhoto) {
                await mediaApi.uploadPhoto(group.id, files);
            } else {
                await mediaApi.uploadReceipt(group.id, files);
            }
            await fetchMedia();
        } catch (err) {
            setError(err.message || "Upload failed");
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const openLightbox = (index) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);

    useEffect(() => {
        const onKey = (e) => {
            if (lightboxIndex === null) return;
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") {
                setLightboxIndex((prev) => (prev + 1) % mediaItems.length);
            }
            if (e.key === "ArrowLeft") {
                setLightboxIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightboxIndex, mediaItems.length]);

    const currentItem = lightboxIndex !== null ? mediaItems[lightboxIndex] : null;
    const currentBlob = currentItem ? blobs[currentItem.id] : null;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-gray-400">Loading…</p>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-5">
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple={isPhoto}
                capture={isPhoto ? undefined : "environment"}
                className="hidden"
                onChange={handleFiles}
            />

            {mediaItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <span className="text-5xl">{isPhoto ? "📷" : "🧾"}</span>
                    <p className="[font-family:'Outfit',Helvetica] text-base font-semibold text-indigo-950">
                        {isPhoto ? "No photos yet" : "No receipts yet"}
                    </p>
                    <p className="[font-family:'Outfit',Helvetica] text-sm text-gray-400">
                        {isPhoto
                            ? "Add photos from your camera or library"
                            : "Scan a receipt to get started"}
                    </p>
                </div>
            ) : (
                <div className={isPhoto ? "grid grid-cols-3 gap-3" : "flex flex-col gap-3"}>
                    {mediaItems.map((item, idx) => {
                        const blobUrl = blobs[item.id];
                        return isPhoto ? (
                            <div
                                key={item.id}
                                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                                onClick={() => openLightbox(idx)}
                            >
                                {blobUrl ? (
                                    <img
                                        src={blobUrl}
                                        alt="Uploaded media"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                                        Failed to load
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                key={item.id}
                                className="group flex items-center gap-3.5 rounded-[14px] bg-white px-4 py-3.5 shadow-[0px_1px_3px_#0000000a]"
                            >
                                <div className="h-12 w-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                                    {blobUrl ? (
                                        <img
                                            src={blobUrl}
                                            alt="Receipt"
                                            className="h-full w-full object-cover cursor-pointer"
                                            onClick={() => openLightbox(idx)}
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                                            -
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="[font-family:'Outfit',Helvetica] truncate text-sm font-semibold text-indigo-950">
                                        Receipt #{item.id}
                                    </p>
                                    <p className="[font-family:'Outfit',Helvetica] text-xs text-gray-400">
                                        {new Date(item.uploaded_at).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                                <span className="text-xs font-medium bg-amber-100 text-amber-600 rounded-full px-2.5 py-1">

                                    {item.expense_id ? "Linked" : "Pending"}
                </span>
                                <button
                                    onClick={() => {
                                        setMediaItems((prev) => prev.filter((m) => m.id !== item.id));
                                        if (blobUrl) URL.revokeObjectURL(blobUrl);
                                    }}
                                    className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-400"
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <div className="flex min-h-[120px] flex-1 items-end justify-center">
                {isPhoto ? (
                    <div className="flex gap-6">
                        <div className="flex flex-col items-center gap-1.5">
                            <button
                                type="button"
                                className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white text-3xl shadow-md transition-colors"
                                onClick={() => {
                                    inputRef.current?.setAttribute("capture", "environment");
                                    inputRef.current?.removeAttribute("multiple");
                                    inputRef.current?.click();
                                }}
                            >
                                +
                            </button>
                            <span className="[font-family:'Outfit',Helvetica] text-xs font-medium text-emerald-500">
                Upload photo
              </span>
                        </div>

                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-1.5">
                        <button
                            type="button"
                            className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white text-3xl shadow-md transition-colors"
                            onClick={() => {
                                inputRef.current?.setAttribute("capture", "environment");
                                inputRef.current?.removeAttribute("multiple");
                                inputRef.current?.click();
                            }}
                        >
                            +
                        </button>
                        <span className="[font-family:'Outfit',Helvetica] text-xs font-medium text-emerald-500">
              Scan Receipt
            </span>
                    </div>
                )}
            </div>

            {uploading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                    <div className="rounded-xl bg-white px-6 py-4 shadow-lg">
                        <p className="text-sm font-medium text-[#101828]">Uploading…</p>
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightboxIndex !== null && currentBlob && (
                <div
                    className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    {/* Close */}
                    <button
                        type="button"
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        ✕
                    </button>

                    {/* Prev */}
                    {mediaItems.length > 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
                            }}
                            className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            ‹
                        </button>
                    )}

                    {/* Image */}
                    <img
                        src={currentBlob}
                        alt="Full view"
                        className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Next */}
                    {mediaItems.length > 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex((prev) => (prev + 1) % mediaItems.length);
                            }}
                            className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            ›
                        </button>
                    )}

                    {/* Counter */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white">
                        {lightboxIndex + 1} / {mediaItems.length}
                    </div>
                </div>
            )}
        </div>
    );
};
