"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  sellerId?: string;
  status?: "available" | "sold";
  views?: number;
  createdAt?: string | null;
};

type FilterType = "all" | "available" | "sold";

function getCategoryIcon(category: string) {
  switch (category) {
    case "Mobiles":
      return "📱";
    case "Laptops":
      return "💻";
    case "Bikes":
      return "🏍️";
    case "Books":
      return "📚";
    case "Furniture":
      return "🛋️";
    case "Electronics":
      return "🎧";
    case "Fashion":
      return "👟";
    default:
      return "📦";
  }
}

function LocationIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
      <path d="M4 4v5h5" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
      <path d="M20 20v-5h-5" />
    </svg>
  );
}

export default function MyListingsPage() {
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [userName, setUserName] = useState("User");

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<FilterType>("all");

  const [actionLoading, setActionLoading] =
    useState<Record<string, boolean>>({});

  // =========================
  // LOAD PAGE
  // =========================
  const loadPage = async (
    showFullLoader = true
  ) => {
    try {
      if (showFullLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      // =========================
      // CHECK AUTH
      // =========================
      const meResponse = await fetch(
        "/api/auth/me",
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const meData =
        await meResponse.json();

      if (
        !meResponse.ok ||
        !meData.authenticated
      ) {
        router.push("/login");
        return;
      }

      const name =
        meData.user?.name?.trim() ||
        "User";

      setUserName(name);

      // =========================
      // GET MY LISTINGS
      // =========================
      const listingsResponse =
        await fetch(
          "/api/listings?mine=true",
          {
            cache: "no-store",
            credentials: "include",
          }
        );

      const listingsData =
        await listingsResponse.json();

      if (
        !listingsResponse.ok ||
        !listingsData.success
      ) {
        throw new Error(
          listingsData.message ||
            "Failed to load your listings."
        );
      }

      setListings(
        Array.isArray(
          listingsData.listings
        )
          ? listingsData.listings
          : []
      );
    } catch (error) {
      console.error(
        "MY LISTINGS ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load your listings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    loadPage(true);
  }, []);

  // =========================
  // CHANGE STATUS
  // =========================
  const handleStatusChange = async (
    listing: Listing
  ) => {
    const listingId =
      listing.id || listing._id;

    if (!listingId) {
      return;
    }

    const isSold =
      listing.status === "sold";

    const newStatus: "available" | "sold" =
      isSold ? "available" : "sold";

    try {
      setActionLoading((prev) => ({
        ...prev,
        [listingId]: true,
      }));

      const response = await fetch(
        `/api/listings/${encodeURIComponent(
          listingId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to update listing status."
        );
      }

      setListings((current) =>
        current.map((item) => {
          const itemId =
            item.id || item._id;

          if (itemId !== listingId) {
            return item;
          }

          return {
            ...item,
            status: newStatus,
          };
        })
      );
    } catch (error) {
      console.error(
        "STATUS UPDATE ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to update listing status."
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [listingId]: false,
      }));
    }
  };

  // =========================
  // DELETE LISTING
  // =========================
  const handleDelete = async (
    listing: Listing
  ) => {
    const listingId =
      listing.id || listing._id;

    if (!listingId) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${listing.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading((prev) => ({
        ...prev,
        [listingId]: true,
      }));

      const response = await fetch(
        `/api/listings/${encodeURIComponent(
          listingId
        )}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to delete listing."
        );
      }

      setListings((current) =>
        current.filter((item) => {
          const itemId =
            item.id || item._id;

          return itemId !== listingId;
        })
      );
    } catch (error) {
      console.error(
        "DELETE LISTING ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete listing."
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [listingId]: false,
      }));
    }
  };

  // =========================
  // STATS
  // =========================
  const totalListings =
    listings.length;

  const soldListings =
    listings.filter(
      (item) => item.status === "sold"
    ).length;

  const availableListings =
    totalListings - soldListings;

  const totalViews =
    listings.reduce(
      (total, listing) =>
        total +
        (Number(listing.views) || 0),
      0
    );

  // =========================
  // FILTERED LISTINGS
  // =========================
  const filteredListings =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return listings.filter(
        (listing) => {
          const status =
            listing.status === "sold"
              ? "sold"
              : "available";

          const matchesFilter =
            filter === "all" ||
            status === filter;

          const matchesSearch =
            !query ||
            listing.title
              .toLowerCase()
              .includes(query) ||
            listing.category
              .toLowerCase()
              .includes(query) ||
            listing.location
              .toLowerCase()
              .includes(query) ||
            listing.description
              .toLowerCase()
              .includes(query) ||
            String(
              listing.price
            ).includes(query);

          return (
            matchesFilter &&
            matchesSearch
          );
        }
      );
    }, [listings, search, filter]);

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-5">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-zinc-200 border-t-[#ff5a1f]" />

          <p className="mt-4 text-sm font-semibold text-zinc-500">
            Loading your listings...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      {/* =========================
          HEADER
      ========================= */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          {/* LOGO */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff5a1f] text-lg font-black text-white shadow-lg shadow-orange-200">
              S
            </div>

            <span className="text-xl font-extrabold tracking-tight">
              Saman
              <span className="text-[#ff5a1f]">
                Becho
              </span>
            </span>
          </Link>

          {/* HEADER ACTIONS */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-[#ff5a1f] sm:block"
            >
              Home
            </Link>

            <Link
              href="/profile"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-[#ff5a1f] sm:block"
            >
              Profile
            </Link>

            <span className="hidden max-w-[180px] truncate px-2 text-sm font-bold text-zinc-700 md:block">
              Hi, {userName} 👋
            </span>

            <Link
              href="/sell"
              className="rounded-xl bg-[#ff5a1f] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-[#e94d17]"
            >
              + Sell
            </Link>
          </div>
        </div>
      </header>

      {/* =========================
          CONTENT
      ========================= */}
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        {/* =========================
            TITLE ROW
        ========================= */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5a1f]">
              Seller Dashboard
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              My Listings
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Manage your products, monitor views,
              and control their availability.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                loadPage(false)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              >
                <RefreshIcon />
              </span>

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <Link
              href="/sell"
              className="inline-flex items-center justify-center rounded-xl bg-[#ff5a1f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-[#e94d17]"
            >
              + Add New Listing
            </Link>
          </div>
        </div>

        {/* =========================
            ERROR
        ========================= */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-bold text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadPage(true)
              }
              className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* =========================
            STATS
        ========================= */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* TOTAL */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-500">
                Total Listings
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-lg">
                📦
              </span>
            </div>

            <p className="mt-3 text-3xl font-black text-zinc-900">
              {totalListings}
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              All your listings
            </p>
          </div>

          {/* AVAILABLE */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-500">
                Available
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-lg">
                🟢
              </span>
            </div>

            <p className="mt-3 text-3xl font-black text-green-600">
              {availableListings}
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Currently for sale
            </p>
          </div>

          {/* SOLD */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-500">
                Sold
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-lg">
                🔴
              </span>
            </div>

            <p className="mt-3 text-3xl font-black text-zinc-900">
              {soldListings}
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Successfully sold
            </p>
          </div>

          {/* VIEWS */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-500">
                Total Views
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <EyeIcon />
              </span>
            </div>

            <p className="mt-3 text-3xl font-black text-zinc-900">
              {totalViews.toLocaleString(
                "en-IN"
              )}
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Views on your listings
            </p>
          </div>
        </div>

        {/* =========================
            SEARCH + FILTER
        ========================= */}
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* SEARCH */}
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 focus-within:border-[#ff5a1f] focus-within:bg-white">
              <span className="text-zinc-400">
                🔎
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search your listings..."
                className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="text-zinc-400 transition hover:text-zinc-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* FILTERS */}
            <div className="flex rounded-xl bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() =>
                  setFilter("all")
                }
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                  filter === "all"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() =>
                  setFilter("available")
                }
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                  filter === "available"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Available
              </button>

              <button
                type="button"
                onClick={() =>
                  setFilter("sold")
                }
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                  filter === "sold"
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Sold
              </button>
            </div>
          </div>

          {/* RESULT COUNT */}
          <p className="mt-3 px-1 text-xs font-medium text-zinc-400">
            Showing{" "}
            {filteredListings.length}{" "}
            of {totalListings} listings
          </p>
        </div>

        {/* =========================
            EMPTY STATE
        ========================= */}
        {!error &&
          listings.length === 0 && (
            <div className="mt-8 rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center shadow-sm sm:p-14">
              <div className="text-6xl">
                📦
              </div>

              <h2 className="mt-5 text-2xl font-black">
                No listings yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                You haven't posted anything yet.
                Create your first listing and start
                selling on SamanBecho.
              </p>

              <Link
                href="/sell"
                className="mt-6 inline-flex rounded-xl bg-[#ff5a1f] px-6 py-3 font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-[#e94d17]"
              >
                Sell Your First Item
              </Link>
            </div>
          )}

        {/* =========================
            FILTER EMPTY
        ========================= */}
        {!error &&
          listings.length > 0 &&
          filteredListings.length === 0 && (
            <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
              <div className="text-5xl">
                🔎
              </div>

              <h2 className="mt-4 text-xl font-black">
                No matching listings
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Try another search or change the
                selected filter.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-5 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
              >
                Clear Filters
              </button>
            </div>
          )}

        {/* =========================
            LISTINGS
        ========================= */}
        {!error &&
          filteredListings.length > 0 && (
            <div className="mt-8 space-y-5">
              {filteredListings.map(
                (listing) => {
                  const listingId =
                    listing.id ||
                    listing._id;

                  const isSold =
                    listing.status ===
                    "sold";

                  const isLoading =
                    Boolean(
                      actionLoading[
                        listingId
                      ]
                    );

                  const image =
                    Array.isArray(
                      listing.photos
                    ) &&
                    listing.photos.length >
                      0
                      ? listing.photos[0]
                      : "";

                  return (
                    <article
                      key={listingId}
                      className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition ${
                        isSold
                          ? "border-zinc-300"
                          : "border-zinc-200 hover:border-zinc-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row">
                        {/* =========================
                            IMAGE
                        ========================= */}
                        <div
                          className={`relative h-64 shrink-0 overflow-hidden bg-zinc-100 sm:h-72 lg:h-60 lg:w-72 ${
                            isSold
                              ? "grayscale"
                              : ""
                          }`}
                        >
                          {image ? (
                            <img
                              src={image}
                              alt={listing.title}
                              className={`h-full w-full object-cover transition duration-300 ${
                                isSold
                                  ? "opacity-60"
                                  : "hover:scale-105"
                              }`}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-7xl">
                              {getCategoryIcon(
                                listing.category
                              )}
                            </div>
                          )}

                          {/* STATUS */}
                          <div className="absolute left-4 top-4">
                            <span
                              className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider shadow-sm ${
                                isSold
                                  ? "bg-zinc-900 text-white"
                                  : "bg-green-600 text-white"
                              }`}
                            >
                              {isSold
                                ? "SOLD"
                                : "AVAILABLE"}
                            </span>
                          </div>
                        </div>

                        {/* =========================
                            DETAILS
                        ========================= */}
                        <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              {/* BADGES */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#ff5a1f]">
                                  {listing.category}
                                </span>

                                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-600">
                                  {listing.condition ||
                                    "Good"}
                                </span>
                              </div>

                              {/* TITLE */}
                              <h2
                                className={`mt-3 text-xl font-black tracking-tight sm:text-2xl ${
                                  isSold
                                    ? "text-zinc-500"
                                    : "text-zinc-900"
                                }`}
                              >
                                {listing.title}
                              </h2>

                              {/* PRICE */}
                              <p
                                className={`mt-2 text-2xl font-black ${
                                  isSold
                                    ? "text-zinc-500"
                                    : "text-zinc-900"
                                }`}
                              >
                                ₹
                                {Number(
                                  listing.price
                                ).toLocaleString(
                                  "en-IN"
                                )}
                              </p>
                            </div>

                            {/* VIEWS */}
                            <div className="flex w-fit shrink-0 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-700 shadow-sm">
                              <span className="text-[#ff5a1f]">
                                <EyeIcon />
                              </span>

                              <span>
                                {Number(
                                  listing.views
                                ) || 0}{" "}
                                views
                              </span>
                            </div>
                          </div>

                          {/* LOCATION */}
                          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
                            <span className="text-[#ff5a1f]">
                              <LocationIcon />
                            </span>

                            <span className="truncate">
                              {listing.location}
                            </span>
                          </div>

                          {/* DESCRIPTION */}
                          <p className="mt-4 line-clamp-2 text-sm leading-6 text-zinc-500">
                            {listing.description ||
                              "No description provided."}
                          </p>

                          {/* CREATED DATE */}
                          {listing.createdAt && (
                            <p className="mt-3 text-xs font-medium text-zinc-400">
                              Listed on{" "}
                              {new Date(
                                listing.createdAt
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          )}

                          {/* ACTIONS */}
                          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {/* VIEW */}
                            <Link
                              href={`/listing/${encodeURIComponent(
                                listingId
                              )}`}
                              className="flex items-center justify-center rounded-xl bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-800 transition hover:bg-zinc-200"
                            >
                              View
                            </Link>

                            {/* EDIT */}
                            <Link
                              href={`/edit/${encodeURIComponent(
                                listingId
                              )}`}
                              className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-800 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#ff5a1f]"
                            >
                              Edit
                            </Link>

                            {/* STATUS */}
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  listing
                                )
                              }
                              disabled={isLoading}
                              className={`rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                isSold
                                  ? "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                  : "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                              }`}
                            >
                              {isLoading
                                ? "Updating..."
                                : isSold
                                  ? "Mark Available"
                                  : "Mark as Sold"}
                            </button>

                            {/* DELETE */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  listing
                                )
                              }
                              disabled={isLoading}
                              className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isLoading
                                ? "Please wait..."
                                : "Delete"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
      </section>
    </main>
  );
}