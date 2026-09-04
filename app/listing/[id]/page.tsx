"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Listing = {
  id: string;
  _id: string;
  title: string;
  price: number;
  category: string;
  location: string;
  condition: string;
  description: string;
  photos: string[];
  sellerName?: string;
  sellerPhone?: string;
  status?: "available" | "sold";
  views?: number;
  createdAt?: string | null;
};

const reportReasons = [
  "Scam or fraud",
  "Fake or misleading product",
  "Wrong price or information",
  "Offensive or inappropriate content",
  "Duplicate listing",
  "Other",
];

export default function ListingDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showContact, setShowContact] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const [selectedPhoto, setSelectedPhoto] = useState(0);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMessage, setReportMessage] = useState("");

  const [shareMessage, setShareMessage] = useState("");

  // =========================
  // FETCH LISTING
  // =========================
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError("");

        const rawId = params?.id;

        const id = Array.isArray(rawId) ? rawId[0] : rawId;

        if (!id || typeof id !== "string") {
          throw new Error("Invalid listing ID");
        }

        const response = await fetch(
          `/api/listings/${encodeURIComponent(id)}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Listing not found");
        }

        const listingData: Listing = data.listing;

        setListing(listingData);

        // =========================
        // RECORD LISTING VIEW
        // =========================
        try {
          const viewResponse = await fetch(
            `/api/listings/${encodeURIComponent(id)}/view`,
            {
              method: "POST",
              credentials: "include",
            }
          );

          const viewData = await viewResponse.json();

          if (viewResponse.ok && viewData.success) {
            setListing((current) => {
              if (!current) {
                return current;
              }

              return {
                ...current,
                views: Number(viewData.views) || 0,
              };
            });
          }
        } catch (viewError) {
          console.error("Listing view error:", viewError);
        }

        // =========================
        // CHECK FAVORITE
        // =========================
        try {
          const meResponse = await fetch("/api/auth/me", {
            cache: "no-store",
            credentials: "include",
          });

          const meData = await meResponse.json();

          if (meResponse.ok && meData.authenticated) {
            const favoritesResponse = await fetch(
              "/api/favorites",
              {
                cache: "no-store",
                credentials: "include",
              }
            );

            const favoritesData =
              await favoritesResponse.json();

            if (
              favoritesResponse.ok &&
              favoritesData.success &&
              Array.isArray(favoritesData.favoriteIds)
            ) {
              setIsFavorite(
                favoritesData.favoriteIds.includes(
                  listingData.id
                )
              );
            }
          }
        } catch (favoriteError) {
          console.error(
            "Favorite check error:",
            favoriteError
          );
        }
      } catch (error) {
        console.error(
          "Listing details error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load listing"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [params]);

  // =========================
  // TOGGLE FAVORITE
  // =========================
  const handleFavorite = async () => {
    if (!listing) {
      return;
    }

    try {
      setFavoriteLoading(true);

      const meResponse = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });

      const meData = await meResponse.json();

      if (!meResponse.ok || !meData.authenticated) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/favorites", {
        method: isFavorite ? "DELETE" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          listingId: listing.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update favorite"
        );
      }

      setIsFavorite((current) => !current);
    } catch (error) {
      console.error("Favorite error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to update favorite"
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  // =========================
  // SHARE LISTING
  // =========================
  const handleShare = async () => {
    if (!listing) {
      return;
    }

    try {
      const shareUrl = window.location.href;

      const shareData = {
        title: listing.title,
        text: `Check out this ${listing.title} on SamanBecho.`,
        url: shareUrl,
      };

      // Native share
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        await navigator.share(shareData);
        return;
      }

      // Copy link fallback
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard
      ) {
        await navigator.clipboard.writeText(shareUrl);

        setShareMessage("✅ Listing link copied!");

        setTimeout(() => {
          setShareMessage("");
        }, 2000);

        return;
      }

      setShareMessage(
        "Please copy the listing URL from your browser."
      );

      setTimeout(() => {
        setShareMessage("");
      }, 2500);
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error("Share listing error:", error);

      setShareMessage("Unable to share listing.");

      setTimeout(() => {
        setShareMessage("");
      }, 2500);
    }
  };

  // =========================
  // REPORT LISTING
  // =========================
  const handleReport = async () => {
    if (!listing) {
      return;
    }

    if (!reportReason) {
      setReportMessage("Please select a reason.");
      return;
    }

    try {
      setReportLoading(true);
      setReportMessage("");

      const response = await fetch("/api/reports", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          listingId: listing.id,
          reason: reportReason,
          details: reportDetails.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }

        throw new Error(
          data.message || "Failed to submit report"
        );
      }

      setReportMessage(
        "✅ Report submitted successfully."
      );

      setReportReason("");
      setReportDetails("");

      setTimeout(() => {
        setShowReport(false);
        setReportMessage("");
      }, 1200);
    } catch (error) {
      console.error("Report error:", error);

      setReportMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Failed to submit report."
      );
    } finally {
      setReportLoading(false);
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-[#ff5a1f]" />

          <p className="mt-4 font-semibold text-zinc-500">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // ERROR
  // =========================
  if (error || !listing) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7f5] px-5 text-center">
        <div className="text-6xl">📦</div>

        <h1 className="mt-5 text-2xl font-black">
          Listing not found
        </h1>

        <p className="mt-2 max-w-md text-zinc-500">
          {error ||
            "This product may have been removed."}
        </p>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-6 rounded-xl bg-[#ff5a1f] px-6 py-3 font-bold text-white transition hover:bg-[#e94d17]"
        >
          Go Home
        </button>
      </main>
    );
  }

  const phone = listing.sellerPhone || "";

  const whatsappNumber =
    phone.length === 10
      ? `91${phone}`
      : phone.replace(/\D/g, "");

  const photos = Array.isArray(listing.photos)
    ? listing.photos
    : [];

  const sellerName =
    listing.sellerName || "SamanBecho Seller";

  const isSold = listing.status === "sold";

  const views = Number(listing.views) || 0;

  return (
    <main className="min-h-screen bg-[#f7f7f5]">

      {/* =========================
          HEADER
      ========================= */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff5a1f] font-black text-white shadow-lg shadow-orange-200">
              S
            </div>

            <span className="text-xl font-extrabold tracking-tight text-zinc-900">
              Saman
              <span className="text-[#ff5a1f]">
                Becho
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-800 transition hover:bg-zinc-50"
          >
            ← Back
          </button>

        </div>
      </header>

      {/* =========================
          SOLD NOTICE
      ========================= */}
      {isSold && (
        <div className="border-b border-zinc-800 bg-zinc-900">
          <div className="mx-auto max-w-6xl px-5 py-3 text-center sm:px-8">
            <p className="text-sm font-bold text-white">
              🔴 This item has been marked as SOLD
            </p>
          </div>
        </div>
      )}

      {/* =========================
          PRODUCT
      ========================= */}
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-2">

          {/* =========================
              PHOTOS
          ========================= */}
          <div>
            <div
              className={`relative overflow-hidden rounded-3xl border bg-white shadow-sm ${
                isSold
                  ? "border-zinc-300"
                  : "border-zinc-200"
              }`}
            >
              {photos.length > 0 ? (
                <img
                  src={
                    photos[selectedPhoto] ||
                    photos[0]
                  }
                  alt={listing.title}
                  className={`h-[420px] w-full bg-zinc-50 object-contain ${
                    isSold
                      ? "opacity-60 grayscale"
                      : ""
                  }`}
                />
              ) : (
                <div className="flex h-[420px] items-center justify-center bg-zinc-100 text-8xl">
                  📦
                </div>
              )}

              {/* SOLD IMAGE BADGE */}
              {isSold && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-2xl bg-black/85 px-7 py-3 text-2xl font-black tracking-[0.15em] text-white shadow-2xl">
                    SOLD
                  </span>
                </div>
              )}

              {/* FAVORITE */}
              <button
                type="button"
                onClick={handleFavorite}
                disabled={favoriteLoading}
                aria-label={
                  isFavorite
                    ? "Remove from favorites"
                    : "Save listing"
                }
                className={`absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition ${
                  isFavorite
                    ? "bg-[#ff5a1f] text-white"
                    : "bg-white text-zinc-700 hover:text-[#ff5a1f]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill={
                    isFavorite
                      ? "currentColor"
                      : "none"
                  }
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.8 8.6c0 5.5-8.8 10.4-8.8 10.4S3.2 14.1 3.2 8.6A4.6 4.6 0 0 1 12 6.1a4.6 4.6 0 0 1 8.8 2.5Z" />
                </svg>
              </button>
            </div>

            {/* THUMBNAILS */}
            {photos.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                {photos.map((photo, index) => (
                  <button
                    key={`${photo}-${index}`}
                    type="button"
                    onClick={() =>
                      setSelectedPhoto(index)
                    }
                    className={`overflow-hidden rounded-xl border-2 bg-white ${
                      selectedPhoto === index
                        ? "border-[#ff5a1f]"
                        : "border-zinc-200"
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Product ${index + 1}`}
                      className={`h-20 w-full object-cover ${
                        isSold
                          ? "opacity-60 grayscale"
                          : ""
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* =========================
              INFO
          ========================= */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

            {/* STATUS */}
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-[#ff5a1f]">
                {listing.category}
              </span>

              {isSold && (
                <span className="inline-flex rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-black text-white">
                  SOLD
                </span>
              )}
            </div>

            {/* TITLE */}
            <h1
              className={`mt-5 text-3xl font-black tracking-tight sm:text-4xl ${
                isSold
                  ? "text-zinc-400"
                  : "text-zinc-900"
              }`}
            >
              {listing.title}
            </h1>

            {/* PRICE */}
            <p
              className={`mt-4 text-3xl font-black ${
                isSold
                  ? "text-zinc-400"
                  : "text-[#ff5a1f]"
              }`}
            >
              ₹
              {Number(listing.price).toLocaleString(
                "en-IN"
              )}
            </p>

            {/* VIEWS */}
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-zinc-500">
              <span>👁</span>

              <span>
                {views}{" "}
                {views === 1
                  ? "view"
                  : "views"}
              </span>
            </div>

            {/* LOCATION + CONDITION */}
            <div className="mt-6 grid gap-4 border-y border-zinc-100 py-6 sm:grid-cols-2">

              {/* LOCATION */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Location
                </p>

                <p className="mt-1 font-semibold text-zinc-900">
                  📍 {listing.location}
                </p>
              </div>

              {/* CONDITION */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Condition
                </p>

                <p className="mt-1 font-semibold text-zinc-900">
                  {listing.condition}
                </p>
              </div>

            </div>

            {/* DESCRIPTION */}
            <div>
              <p className="text-sm font-bold text-zinc-900">
                Description
              </p>

              <p className="mt-2 whitespace-pre-wrap leading-7 text-zinc-700">
                {listing.description}
              </p>
            </div>

            {/* SELLER CARD */}
            <div className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">

              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Seller
              </p>

              <div className="mt-3 flex items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-lg font-black text-[#ff5a1f]">
                  {sellerName
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-bold text-zinc-900">
                    {sellerName}
                  </p>

                  <p className="text-sm text-zinc-500">
                    SamanBecho member
                  </p>
                </div>

              </div>
            </div>

            {/* SHARE LISTING */}
            <button
              type="button"
              onClick={handleShare}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3.5 font-bold text-zinc-800 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#ff5a1f]"
            >
              <span className="text-lg">↗</span>
              Share Listing
            </button>

            {shareMessage && (
              <div className="mt-2 rounded-xl bg-green-50 px-4 py-2.5 text-center text-sm font-semibold text-green-700">
                {shareMessage}
              </div>
            )}

            {/* CONTACT */}
            {isSold ? (
              <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-100 px-5 py-4 text-center">
                <p className="font-bold text-zinc-700">
                  This item is already sold
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Contact options are unavailable
                  for this listing.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setShowContact(true)
                }
                className="mt-8 w-full rounded-xl bg-[#ff5a1f] py-4 font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-[#e94d17]"
              >
                Contact Seller
              </button>
            )}

            {/* SAVE */}
            <button
              type="button"
              onClick={handleFavorite}
              disabled={favoriteLoading}
              className="mt-3 w-full rounded-xl border border-zinc-200 bg-white py-4 font-bold text-zinc-800 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#ff5a1f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFavorite
                ? "❤️ Saved"
                : "♡ Save Listing"}
            </button>

            {/* REPORT */}
            <button
              type="button"
              onClick={() => {
                setShowReport(true);
                setReportMessage("");
              }}
              className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 py-3.5 font-bold text-red-600 transition hover:bg-red-100"
            >
              🚩 Report Listing
            </button>

          </div>
        </div>
      </section>

      {/* =========================
          CONTACT MODAL
      ========================= */}
      {showContact && !isSold && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5"
          onClick={() => setShowContact(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#ff5a1f]">
                  Seller
                </p>

                <h2 className="mt-1 text-xl font-black text-zinc-900">
                  Contact Seller
                </h2>

                <p className="mt-1 text-sm font-semibold text-zinc-600">
                  {sellerName}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowContact(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              >
                ✕
              </button>

            </div>

            {phone ? (
              <>
                <p className="mt-5 text-sm text-zinc-500">
                  Seller's mobile number
                </p>

                <p className="mt-1 text-2xl font-black text-zinc-900">
                  +91 {phone}
                </p>

                <div className="mt-6 grid gap-3">

                  <a
                    href={`tel:+91${phone}`}
                    className="flex items-center justify-center rounded-xl bg-[#ff5a1f] py-3.5 font-bold text-white transition hover:bg-[#e94d17]"
                  >
                    📞 Call Seller
                  </a>

                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                      `Hi, I'm interested in your "${listing.title}" listed on SamanBecho.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-xl bg-green-600 py-3.5 font-bold text-white transition hover:bg-green-700"
                  >
                    💬 WhatsApp Seller
                  </a>

                </div>

                <p className="mt-5 text-center text-xs leading-5 text-zinc-400">
                  Never share OTPs, passwords or sensitive
                  financial information with anyone.
                </p>
              </>
            ) : (
              <div className="mt-5 rounded-2xl bg-zinc-50 p-5 text-center">

                <p className="text-4xl">📵</p>

                <p className="mt-3 font-bold text-zinc-900">
                  Contact number not available
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  This seller has not provided a contact
                  number.
                </p>

              </div>
            )}

          </div>
        </div>
      )}

      {/* =========================
          REPORT MODAL
      ========================= */}
      {showReport && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-5"
          onClick={() => setShowReport(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                  Safety
                </p>

                <h2 className="mt-1 text-xl font-black text-zinc-900">
                  Report Listing
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Help us keep SamanBecho safe.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowReport(false)
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              >
                ✕
              </button>

            </div>

            {/* REASON */}
            <div className="mt-6">

              <label className="text-sm font-bold text-zinc-900">
                Why are you reporting this listing?
              </label>

              <select
                value={reportReason}
                onChange={(event) =>
                  setReportReason(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-red-400"
              >
                <option value="">
                  Select a reason
                </option>

                {reportReasons.map((reason) => (
                  <option
                    key={reason}
                    value={reason}
                  >
                    {reason}
                  </option>
                ))}
              </select>

            </div>

            {/* DETAILS */}
            <div className="mt-5">

              <label className="text-sm font-bold text-zinc-900">
                Additional details{" "}
                <span className="font-normal text-zinc-400">
                  (optional)
                </span>
              </label>

              <textarea
                rows={4}
                value={reportDetails}
                onChange={(event) =>
                  setReportDetails(
                    event.target.value
                  )
                }
                maxLength={500}
                placeholder="Tell us what looks suspicious..."
                className="mt-2 w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-red-400"
              />

              <p className="mt-1 text-right text-xs text-zinc-400">
                {reportDetails.length}/500
              </p>

            </div>

            {/* MESSAGE */}
            {reportMessage && (
              <div
                className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
                  reportMessage.startsWith("✅")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {reportMessage}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="button"
              onClick={handleReport}
              disabled={reportLoading}
              className="mt-5 w-full rounded-xl bg-red-500 py-3.5 font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reportLoading
                ? "Submitting..."
                : "Submit Report"}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-zinc-400">
              False or abusive reports may be reviewed.
            </p>

          </div>
        </div>
      )}

    </main>
  );
}