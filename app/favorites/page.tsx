"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Listing = {
  id: string;
  title: string;
  price: number;
  category: string;
  location: string;
  condition: string;
  description: string;
  photos?: string[];
};

export default function FavoritesPage() {
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState("");

  // =========================
  // LOAD FAVORITES
  // =========================
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setLoading(true);
        setError("");

        // =========================
        // CHECK SERVER SESSION
        // =========================
        const meResponse = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        const meData = await meResponse.json();

        if (
          !meResponse.ok ||
          !meData.success ||
          !meData.authenticated
        ) {
          router.replace("/login");
          return;
        }

        // =========================
        // GET FAVORITE IDS
        // =========================
        const favoritesResponse = await fetch(
          "/api/favorites",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        const favoritesData =
          await favoritesResponse.json();

        if (
          !favoritesResponse.ok ||
          !favoritesData.success
        ) {
          throw new Error(
            favoritesData.message ||
              "Failed to load favorites"
          );
        }

        const favoriteIds: string[] =
          Array.isArray(
            favoritesData.favoriteIds
          )
            ? favoritesData.favoriteIds
            : [];

        // No favorites
        if (favoriteIds.length === 0) {
          setListings([]);
          return;
        }

        // =========================
        // GET ALL PUBLIC LISTINGS
        // =========================
        const listingsResponse = await fetch(
          "/api/listings",
          {
            method: "GET",
            cache: "no-store",
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
              "Failed to load listings"
          );
        }

        const allListings: Listing[] =
          Array.isArray(
            listingsData.listings
          )
            ? listingsData.listings
            : [];

        // =========================
        // ONLY SAVED LISTINGS
        // =========================
        const savedListings =
          allListings.filter(
            (listing) =>
              favoriteIds.includes(
                listing.id
              )
          );

        // =========================
        // REMOVE BROKEN FAVORITES
        // =========================
        const validFavoriteIds =
          savedListings.map(
            (listing) => listing.id
          );

        const missingFavoriteIds =
          favoriteIds.filter(
            (id) =>
              !validFavoriteIds.includes(id)
          );

        // Clean favorites whose listing
        // no longer exists
        if (
          missingFavoriteIds.length > 0
        ) {
          await Promise.all(
            missingFavoriteIds.map(
              async (listingId) => {
                try {
                  await fetch(
                    "/api/favorites",
                    {
                      method: "DELETE",
                      headers: {
                        "Content-Type":
                          "application/json",
                      },
                      credentials:
                        "include",
                      body: JSON.stringify({
                        listingId,
                      }),
                    }
                  );
                } catch {
                  // Ignore cleanup failure
                }
              }
            )
          );
        }

        setListings(savedListings);
      } catch (error) {
        console.error(
          "Favorites page error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load saved listings."
        );
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [router]);

  // =========================
  // REMOVE FAVORITE
  // =========================
  const handleRemove = async (
    listingId: string
  ) => {
    try {
      setRemovingId(listingId);
      setError("");

      const response = await fetch(
        "/api/favorites",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            listingId,
          }),
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to remove saved listing"
        );
      }

      // Instantly remove from UI
      setListings((current) =>
        current.filter(
          (item) =>
            item.id !== listingId
        )
      );
    } catch (error) {
      console.error(
        "Remove favorite error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to remove saved listing."
      );
    } finally {
      setRemovingId("");
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
            Loading saved items...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

          {/* LOGO */}
          <Link
            href="/"
            className="flex items-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff5a1f] font-black text-white shadow-lg shadow-orange-200">
              S
            </div>

            <span className="text-xl font-extrabold tracking-tight">
              Saman
              <span className="text-[#ff5a1f]">
                Becho
              </span>
            </span>
          </Link>

          {/* ACTIONS */}
          <div className="flex items-center gap-2">

            <Link
              href="/my-listings"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold transition hover:bg-zinc-50"
            >
              My Listings
            </Link>

            <Link
              href="/sell"
              className="rounded-xl bg-[#ff5a1f] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-[#e94d17]"
            >
              + Sell Item
            </Link>

          </div>
        </div>
      </header>

      {/* ========================= */}
      {/* CONTENT */}
      {/* ========================= */}

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">

        {/* TITLE */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5a1f]">
            Your saved items
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Favorites
          </h1>

          <p className="mt-2 text-zinc-500">
            Products you saved for later.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* ========================= */}
        {/* EMPTY STATE */}
        {/* ========================= */}

        {!error &&
          listings.length === 0 && (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-20 text-center shadow-sm">

              <div className="text-6xl">
                ❤️
              </div>

              <h2 className="mt-5 text-2xl font-black text-zinc-900">
                No saved items yet
              </h2>

              <p className="mt-2 text-zinc-500">
                Tap the heart on a listing to save it
                here.
              </p>

              <Link
                href="/"
                className="mt-6 inline-flex rounded-xl bg-[#ff5a1f] px-6 py-3 font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-[#e94d17]"
              >
                Browse Listings
              </Link>

            </div>
          )}

        {/* ========================= */}
        {/* SAVED LISTINGS */}
        {/* ========================= */}

        {!error &&
          listings.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {listings.map(
                (item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >

                    {/* IMAGE */}
                    <div className="relative flex h-56 items-center justify-center overflow-hidden bg-zinc-100">

                      {item.photos &&
                      item.photos.length >
                        0 ? (
                        <img
                          src={
                            item.photos[0]
                          }
                          alt={
                            item.title
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-7xl">
                          📦
                        </div>
                      )}

                      {/* REMOVE */}
                      <button
                        type="button"
                        onClick={() =>
                          handleRemove(
                            item.id
                          )
                        }
                        disabled={
                          removingId ===
                          item.id
                        }
                        aria-label={`Remove ${item.title} from favorites`}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5a1f] text-white shadow-md transition hover:bg-[#e94d17] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        ❤️
                      </button>

                      {/* CONDITION */}
                      <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-zinc-700 backdrop-blur">
                        {item.condition}
                      </span>

                    </div>

                    {/* DETAILS */}
                    <div className="p-4">

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">
                          <h2 className="truncate font-black text-zinc-900">
                            {item.title}
                          </h2>

                          <p className="mt-1 text-xs font-semibold text-[#ff5a1f]">
                            {item.category}
                          </p>
                        </div>

                        <span className="shrink-0 text-lg font-black text-zinc-900">
                          ₹
                          {Number(
                            item.price
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </span>

                      </div>

                      <p className="mt-3 text-xs text-zinc-400">
                        📍 {item.location}
                      </p>

                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-500">
                        {item.description}
                      </p>

                      <Link
                        href={`/listing/${item.id}`}
                        className="mt-4 flex w-full items-center justify-center rounded-xl bg-zinc-100 py-2.5 text-sm font-bold text-zinc-800 transition hover:bg-[#ff5a1f] hover:text-white"
                      >
                        View Details
                      </Link>

                    </div>

                  </article>
                )
              )}

            </div>
          )}

      </section>
    </main>
  );
}