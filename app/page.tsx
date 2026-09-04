"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const categories = [
  { name: "Mobiles", icon: "📱" },
  { name: "Laptops", icon: "💻" },
  { name: "Bikes", icon: "🏍️" },
  { name: "Books", icon: "📚" },
  { name: "Furniture", icon: "🛋️" },
  { name: "Electronics", icon: "🎧" },
  { name: "Fashion", icon: "👟" },
  { name: "Other", icon: "📦" },
];

type Listing = {
  id: string;
  title: string;
  price: number;
  category: string;
  location: string;
  condition: string;
  description: string;
  photos?: string[];
  sellerPhone?: string;
  sellerId?: string;
  sellerName?: string;
  status?: "available" | "sold";
  createdAt?: string;
};

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      width="18"
      height="18"
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

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function HeartIcon({
  filled = false,
}: {
  filled?: boolean;
}) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.8 8.6c0 5.5-8.8 10.4-8.8 10.4S3.2 14.1 3.2 8.6A4.6 4.6 0 0 1 12 6.1a4.6 4.6 0 0 1 8.8 2.5Z" />
    </svg>
  );
}

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

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] =
    useState(true);

  const [search, setSearch] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] =
    useState("User");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  // =========================
  // FAVORITES
  // =========================
  const [favoriteIds, setFavoriteIds] =
    useState<string[]>([]);

  const [favoriteLoadingId, setFavoriteLoadingId] =
    useState("");

  // =========================
  // FETCH ALL LISTINGS
  // =========================
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoadingListings(true);

        const response = await fetch(
          "/api/listings",
          {
            cache: "no-store",
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
              "Failed to fetch listings"
          );
        }

        setListings(
          Array.isArray(data.listings)
            ? data.listings
            : []
        );
      } catch (error) {
        console.error(
          "Fetch listings error:",
          error
        );

        setListings([]);
      } finally {
        setLoadingListings(false);
      }
    };

    fetchListings();
  }, []);

  // =========================
  // CHECK AUTH
  // =========================
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response =
          await fetch(
            "/api/auth/me",
            {
              cache: "no-store",
              credentials:
                "include",
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.authenticated
        ) {
          setIsLoggedIn(false);
          setUserName("User");
          setFavoriteIds([]);
          return;
        }

        setIsLoggedIn(true);

        setUserName(
          data.user?.name?.trim() ||
            "User"
        );

        localStorage.setItem(
          "samanbecho_logged_in",
          "true"
        );

        localStorage.setItem(
          "samanbecho_user_id",
          data.user.id
        );

        localStorage.setItem(
          "samanbecho_user_name",
          data.user.name
        );

        localStorage.setItem(
          "samanbecho_user_phone",
          data.user.phone
        );

        // =========================
        // FETCH USER FAVORITES
        // =========================
        const favoriteResponse =
          await fetch(
            "/api/favorites",
            {
              cache: "no-store",
              credentials:
                "include",
            }
          );

        if (
          favoriteResponse.ok
        ) {
          const favoriteData =
            await favoriteResponse.json();

          if (
            favoriteData.success &&
            Array.isArray(
              favoriteData.favoriteIds
            )
          ) {
            setFavoriteIds(
              favoriteData.favoriteIds
            );
          }
        }
      } catch (error) {
        console.error(
          "Auth check error:",
          error
        );

        setIsLoggedIn(false);
        setUserName("User");
        setFavoriteIds([]);
      }
    };

    checkLogin();
  }, []);

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    try {
      const response =
        await fetch(
          "/api/auth/logout",
          {
            method: "POST",
            credentials:
              "include",
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
            "Logout failed"
        );
      }
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    } finally {
      localStorage.removeItem(
        "samanbecho_logged_in"
      );

      localStorage.removeItem(
        "samanbecho_user_id"
      );

      localStorage.removeItem(
        "samanbecho_user_name"
      );

      localStorage.removeItem(
        "samanbecho_user_phone"
      );

      setIsLoggedIn(false);
      setUserName("User");
      setFavoriteIds([]);
      setMobileMenuOpen(false);

      window.location.href = "/";
    }
  };

  // =========================
  // TOGGLE FAVORITE
  // =========================
  const handleFavorite = async (
    listingId: string
  ) => {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }

    try {
      setFavoriteLoadingId(
        listingId
      );

      const isFavorite =
        favoriteIds.includes(
          listingId
        );

      const response =
        await fetch(
          "/api/favorites",
          {
            method: isFavorite
              ? "DELETE"
              : "POST",

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

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to update favorite"
        );
      }

      setFavoriteIds(
        (current) => {
          if (isFavorite) {
            return current.filter(
              (id) =>
                id !== listingId
            );
          }

          return [
            ...current,
            listingId,
          ];
        }
      );
    } catch (error) {
      console.error(
        "Favorite error:",
        error
      );

      alert(
        "Unable to update favorite. Please try again."
      );
    } finally {
      setFavoriteLoadingId("");
    }
  };

  // =========================
  // CLOSE MOBILE MENU ON
  // NAVIGATION
  // =========================
  const closeMobileMenu =
    () => {
      setMobileMenuOpen(false);
    };

  // =========================
  // SEARCH FILTER
  // =========================
  const filteredListings =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      if (!text) {
        return listings;
      }

      return listings.filter(
        (item) => {
          return (
            item.title
              .toLowerCase()
              .includes(text) ||
            item.category
              .toLowerCase()
              .includes(text) ||
            item.location
              .toLowerCase()
              .includes(text) ||
            item.description
              .toLowerCase()
              .includes(text) ||
            String(
              item.price
            ).includes(text)
          );
        }
      );
    }, [
      listings,
      search,
    ]);

  const handleSearchSubmit =
    (
      e: React.FormEvent<HTMLFormElement>
    ) => {
      e.preventDefault();

      document
        .getElementById(
          "listings"
        )
        ?.scrollIntoView({
          behavior:
            "smooth",
        });

      setMobileMenuOpen(false);
    };

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">

      {/* =========================
          HEADER
      ========================= */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-5 px-5 sm:px-8 lg:px-10">

          {/* LOGO */}
          <Link
            href="/"
            className="shrink-0"
            onClick={
              closeMobileMenu
            }
          >
            <div className="flex items-center gap-2.5">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff5a1f] text-lg font-black text-white shadow-lg shadow-orange-200">
                S
              </div>

              <span className="text-xl font-extrabold tracking-tight">
                Saman
                <span className="text-[#ff5a1f]">
                  Becho
                </span>
              </span>

            </div>
          </Link>

          {/* LOCATION */}
          <button
            type="button"
            className="hidden items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-zinc-100 md:flex"
          >
            <span className="text-[#ff5a1f]">
              <LocationIcon />
            </span>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Location
              </p>

              <p className="text-sm font-semibold">
                Delhi NCR
              </p>
            </div>
          </button>

          {/* DESKTOP SEARCH */}
          <form
            onSubmit={
              handleSearchSubmit
            }
            className="hidden min-w-0 flex-1 md:block"
          >
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 transition focus-within:border-[#ff5a1f] focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100">

              <span className="text-zinc-400">
                <SearchIcon />
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search for laptops, phones, bikes, furniture..."
                className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />

            </div>
          </form>

          {/* =========================
              DESKTOP USER ACTIONS
          ========================= */}
          <div className="ml-auto hidden items-center gap-1 sm:gap-2 md:flex">

            {isLoggedIn ? (
              <>
                {/* MY LISTINGS */}
                <Link
                  href="/my-listings"
                  className="hidden rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-[#ff5a1f] lg:block"
                >
                  My Listings
                </Link>

                {/* PROFILE */}
                <Link
                  href="/profile"
                  className="hidden rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-[#ff5a1f] lg:block"
                >
                  Profile
                </Link>

                {/* SAVED */}
                <Link
                  href="/favorites"
                  className="hidden rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-[#ff5a1f] lg:block"
                >
                  Saved
                </Link>

                {/* USER NAME */}
                <div className="hidden rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-700 lg:block">
                  Hi, {userName} 👋
                </div>

                {/* LOGOUT */}
                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-red-500 sm:px-4"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-zinc-100"
              >
                Login
              </Link>
            )}

            {/* SELL ITEM */}
            <Link
              href="/sell"
              className="flex items-center gap-2 rounded-xl bg-[#ff5a1f] px-3 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-[#e94d17] sm:px-4"
            >
              <span className="text-lg leading-none">
                +
              </span>

              <span>
                Sell Item
              </span>
            </Link>

          </div>

          {/* =========================
              MOBILE HEADER ACTIONS
          ========================= */}
          <div className="ml-auto flex items-center gap-2 md:hidden">

            <Link
              href="/sell"
              onClick={
                closeMobileMenu
              }
              className="rounded-xl bg-[#ff5a1f] px-3 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200"
            >
              + Sell
            </Link>

            <button
              type="button"
              aria-label={
                mobileMenuOpen
                  ? "Close menu"
                  : "Open menu"
              }
              aria-expanded={
                mobileMenuOpen
              }
              onClick={() =>
                setMobileMenuOpen(
                  (current) =>
                    !current
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-800 transition hover:bg-zinc-50"
            >
              {mobileMenuOpen ? (
                <span className="text-xl font-bold">
                  ✕
                </span>
              ) : (
                <span className="text-xl font-bold">
                  ☰
                </span>
              )}
            </button>

          </div>

        </div>

        {/* =========================
            MOBILE SEARCH
        ========================= */}
        <div className="border-t border-black/5 px-5 pb-4 pt-2 md:hidden">

          <form
            onSubmit={
              handleSearchSubmit
            }
            className="flex h-11 items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3"
          >

            <span className="text-zinc-400">
              <SearchIcon />
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search anything..."
              className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            />

          </form>

        </div>

        {/* =========================
            MOBILE MENU
        ========================= */}
        {mobileMenuOpen && (
          <div className="border-t border-zinc-100 bg-white shadow-xl md:hidden">

            <div className="mx-auto max-w-7xl px-5 py-4">

              {isLoggedIn ? (
                <>
                  {/* USER HEADER */}
                  <div className="mb-3 rounded-2xl bg-orange-50 p-4">

                    <p className="text-xs font-bold uppercase tracking-wider text-[#ff5a1f]">
                      Account
                    </p>

                    <p className="mt-1 font-black text-zinc-900">
                      Hi, {userName} 👋
                    </p>

                  </div>

                  {/* PROFILE */}
                  <Link
                    href="/profile"
                    onClick={
                      closeMobileMenu
                    }
                    className="flex items-center gap-3 rounded-xl px-4 py-3.5 font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <span className="text-xl">
                      👤
                    </span>

                    Profile
                  </Link>

                  {/* MY LISTINGS */}
                  <Link
                    href="/my-listings"
                    onClick={
                      closeMobileMenu
                    }
                    className="flex items-center gap-3 rounded-xl px-4 py-3.5 font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <span className="text-xl">
                      📦
                    </span>

                    My Listings
                  </Link>

                  {/* SAVED */}
                  <Link
                    href="/favorites"
                    onClick={
                      closeMobileMenu
                    }
                    className="flex items-center gap-3 rounded-xl px-4 py-3.5 font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <span className="text-xl">
                      ❤️
                    </span>

                    Saved Items
                  </Link>

                  {/* SELL */}
                  <Link
                    href="/sell"
                    onClick={
                      closeMobileMenu
                    }
                    className="flex items-center gap-3 rounded-xl px-4 py-3.5 font-semibold text-[#ff5a1f] transition hover:bg-orange-50"
                  >
                    <span className="text-xl">
                      🏷️
                    </span>

                    Sell an Item
                  </Link>

                  <div className="my-2 border-t border-zinc-100" />

                  {/* LOGOUT */}
                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left font-semibold text-red-500 transition hover:bg-red-50"
                  >
                    <span className="text-xl">
                      🚪
                    </span>

                    Logout
                  </button>
                </>
              ) : (
                <>
                  {/* LOGIN */}
                  <Link
                    href="/login"
                    onClick={
                      closeMobileMenu
                    }
                    className="flex items-center gap-3 rounded-xl px-4 py-3.5 font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <span className="text-xl">
                      🔐
                    </span>

                    Login
                  </Link>

                  {/* SELL */}
                  <Link
                    href="/sell"
                    onClick={
                      closeMobileMenu
                    }
                    className="mt-1 flex items-center gap-3 rounded-xl px-4 py-3.5 font-semibold text-[#ff5a1f] transition hover:bg-orange-50"
                  >
                    <span className="text-xl">
                      🏷️
                    </span>

                    Sell an Item
                  </Link>
                </>
              )}

            </div>
          </div>
        )}

      </header>

      {/* =========================
          HERO
      ========================= */}
      <section className="relative overflow-hidden bg-white">

        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-orange-100 blur-3xl" />

        <div className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-amber-50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:py-24">

          <div>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-[#e94d17]">
              <span className="h-2 w-2 rounded-full bg-[#ff5a1f]" />
              Your local marketplace
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Buy better.
              <br />

              <span className="text-[#ff5a1f]">
                Sell smarter.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-zinc-500 sm:text-lg">
              Buy and sell pre-owned products around you.
              From laptops and phones to bikes, books and
              furniture — find great deals nearby.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">

              <Link
                href="#listings"
                className="flex h-13 items-center justify-center gap-2 rounded-xl bg-[#ff5a1f] px-6 font-bold text-white shadow-xl shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-[#e94d17]"
              >
                Explore Listings
                <ArrowIcon />
              </Link>

              <Link
                href="/sell"
                className="flex h-13 items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 font-bold transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                Start Selling
              </Link>

            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-zinc-500">

              <span>
                <strong className="text-zinc-900">
                  {listings.length}+
                </strong>{" "}
                Listings
              </span>

              <span>
                <strong className="text-zinc-900">
                  50+
                </strong>{" "}
                Categories
              </span>

              <span>
                <strong className="text-zinc-900">
                  100%
                </strong>{" "}
                Local
              </span>

            </div>

          </div>

          {/* HERO VISUAL */}
          <div className="relative mx-auto w-full max-w-lg">

            <div className="rounded-[2rem] bg-[#171717] p-4 shadow-2xl sm:p-5">

              <div className="rounded-[1.5rem] bg-[#252525] p-5 sm:p-7">

                <div className="mb-5 flex items-center justify-between">

                  <span className="text-sm font-semibold text-white/60">
                    Popular near you
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                    Today
                  </span>

                </div>

                <div className="grid grid-cols-2 gap-3">

                  <div className="rounded-2xl bg-white p-4">

                    <div className="flex h-28 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-slate-200 text-6xl">
                      💻
                    </div>

                    <p className="mt-3 text-sm font-bold">
                      MacBook Air
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      ₹48,000
                    </p>

                  </div>

                  <div className="rounded-2xl bg-white p-4">

                    <div className="flex h-28 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 text-6xl">
                      📱
                    </div>

                    <p className="mt-3 text-sm font-bold">
                      iPhone 13
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      ₹38,500
                    </p>

                  </div>

                  <div className="col-span-2 flex items-center gap-4 rounded-2xl bg-[#ff5a1f] p-4 text-white">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15 text-3xl">
                      🛍️
                    </div>

                    <div>
                      <p className="font-bold">
                        Find something you love.
                      </p>

                      <p className="mt-1 text-xs text-white/70">
                        Great products. Better prices. Nearby.
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            </div>

            <div className="absolute -bottom-4 -left-4 rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-xl sm:-left-8">

              <p className="text-xs text-zinc-400">
                Average savings
              </p>

              <p className="text-lg font-black text-[#ff5a1f]">
                30–60%
              </p>

            </div>

          </div>

        </div>
      </section>

      {/* =========================
          CATEGORIES
      ========================= */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">

        <div className="mb-7 flex items-end justify-between">

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5a1f]">
              Explore
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Browse categories
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              setSearch("")
            }
            className="hidden items-center gap-1 text-sm font-bold text-[#ff5a1f] sm:flex"
          >
            View all
            <ArrowIcon />
          </button>

        </div>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 lg:grid-cols-8">

          {categories.map(
            (category) => (
              <button
                type="button"
                key={category.name}
                onClick={() => {
                  setSearch(
                    category.name
                  );

                  document
                    .getElementById(
                      "listings"
                    )
                    ?.scrollIntoView({
                      behavior:
                        "smooth",
                    });
                }}
                className="group rounded-2xl border border-zinc-200 bg-white p-4 text-center transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100"
              >

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 text-2xl transition group-hover:bg-orange-50">
                  {category.icon}
                </div>

                <p className="mt-3 text-xs font-bold sm:text-sm">
                  {category.name}
                </p>

              </button>
            )
          )}

        </div>
      </section>

      {/* =========================
          LISTINGS
      ========================= */}
      <section
        id="listings"
        className="bg-white py-14"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <div className="mb-8 flex items-end justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5a1f]">
                Fresh on SamanBecho
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Latest listings
              </h2>
            </div>

            {search && (
              <p className="text-sm font-semibold text-zinc-400">
                {filteredListings.length}{" "}
                result
                {filteredListings.length ===
                1
                  ? ""
                  : "s"}
              </p>
            )}

          </div>

          {/* LOADING */}
          {loadingListings && (
            <div className="py-16 text-center">

              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-[#ff5a1f]" />

              <p className="mt-4 text-sm font-semibold text-zinc-500">
                Loading listings...
              </p>

            </div>
          )}

          {/* EMPTY */}
          {!loadingListings &&
            filteredListings.length ===
              0 && (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">

                <div className="text-5xl">
                  🔎
                </div>

                <h3 className="mt-4 text-lg font-bold">
                  {search
                    ? `No results for "${search}"`
                    : "No listings found"}
                </h3>

                <p className="mt-2 text-sm text-zinc-500">
                  {search
                    ? "Try another product, category or location."
                    : "Be the first person to sell something."}
                </p>

                {search ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    className="mt-5 rounded-xl bg-[#ff5a1f] px-5 py-3 text-sm font-bold text-white hover:bg-[#e94d17]"
                  >
                    Clear Search
                  </button>
                ) : (
                  <Link
                    href="/sell"
                    className="mt-5 inline-flex rounded-xl bg-[#ff5a1f] px-5 py-3 text-sm font-bold text-white"
                  >
                    Sell an Item
                  </Link>
                )}

              </div>
            )}

          {/* LISTINGS */}
          {!loadingListings &&
            filteredListings.length >
              0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

                {filteredListings.map(
                  (
                    item,
                    index
                  ) => {

                    const isFavorite =
                      favoriteIds.includes(
                        item.id
                      );

                    const isFavoriteLoading =
                      favoriteLoadingId ===
                      item.id;

                    const isSold =
                      item.status ===
                      "sold";

                    return (
                      <article
                        key={item.id}
                        className={`group overflow-hidden rounded-2xl border bg-white transition duration-300 ${
                          isSold
                            ? "border-zinc-300"
                            : "border-zinc-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl"
                        }`}
                      >

                        {/* IMAGE */}
                        <div
                          className={`relative flex h-56 items-center justify-center overflow-hidden ${
                            index % 4 ===
                            0
                              ? "bg-gradient-to-br from-blue-100 to-slate-200"
                              : index % 4 ===
                                1
                              ? "bg-gradient-to-br from-pink-100 to-purple-100"
                              : index % 4 ===
                                2
                              ? "bg-gradient-to-br from-amber-100 to-orange-100"
                              : "bg-gradient-to-br from-red-100 to-yellow-100"
                          }`}
                        >

                          {item.photos &&
                          item.photos.length >
                            0 ? (
                            <img
                              src={
                                item
                                  .photos[0]
                              }
                              alt={
                                item.title
                              }
                              className={`h-full w-full object-cover transition duration-500 ${
                                isSold
                                  ? "opacity-60 grayscale"
                                  : "group-hover:scale-105"
                              }`}
                            />
                          ) : (
                            <span
                              className={`text-7xl ${
                                isSold
                                  ? "opacity-50 grayscale"
                                  : ""
                              }`}
                            >
                              {getCategoryIcon(
                                item.category
                              )}
                            </span>
                          )}

                          {/* SOLD */}
                          {isSold && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="rounded-xl bg-black/80 px-5 py-2.5 text-lg font-black tracking-widest text-white shadow-xl">
                                SOLD
                              </span>
                            </div>
                          )}

                          {/* HEART */}
                          <button
                            type="button"
                            aria-label={
                              isFavorite
                                ? `Remove ${item.title} from saved`
                                : `Save ${item.title}`
                            }
                            onClick={() =>
                              handleFavorite(
                                item.id
                              )
                            }
                            disabled={
                              isFavoriteLoading
                            }
                            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur transition ${
                              isFavorite
                                ? "bg-[#ff5a1f] text-white hover:bg-[#e94d17]"
                                : "bg-white/90 text-zinc-700 hover:bg-white hover:text-[#ff5a1f]"
                            } ${
                              isFavoriteLoading
                                ? "cursor-not-allowed opacity-60"
                                : ""
                            }`}
                          >
                            <HeartIcon
                              filled={
                                isFavorite
                              }
                            />
                          </button>

                          {/* CONDITION */}
                          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-zinc-700 backdrop-blur">
                            {
                              item.condition
                            }
                          </span>

                        </div>

                        {/* DETAILS */}
                        <div className="p-4">

                          <div className="flex items-start justify-between gap-3">

                            <h3
                              className={`font-bold ${
                                isSold
                                  ? "text-zinc-400"
                                  : "text-zinc-900"
                              }`}
                            >
                              {
                                item.title
                              }
                            </h3>

                            <span
                              className={`shrink-0 text-lg font-black ${
                                isSold
                                  ? "text-zinc-400"
                                  : "text-zinc-900"
                              }`}
                            >
                              ₹
                              {Number(
                                item.price
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </span>

                          </div>

                          <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
                            <LocationIcon />
                            {
                              item.location
                            }
                          </div>

                          <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-500">
                            {
                              item.description
                            }
                          </p>

                          <p className="mt-2 text-xs font-semibold text-[#ff5a1f]">
                            {
                              item.category
                            }
                          </p>

                          <Link
                            href={`/listing/${item.id}`}
                            className={`mt-4 flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-bold transition ${
                              isSold
                                ? "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                                : "bg-zinc-100 hover:bg-[#ff5a1f] hover:text-white"
                            }`}
                          >
                            {isSold
                              ? "View Sold Listing"
                              : "View details"}
                          </Link>

                        </div>
                      </article>
                    );
                  }
                )}

              </div>
            )}

        </div>
      </section>

      {/* =========================
          HOW IT WORKS
      ========================= */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">

        <div className="rounded-[2rem] bg-[#171717] px-6 py-12 text-white sm:px-10 lg:px-14">

          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
                Simple & local
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Buying and selling
                <br />
                made simple.
              </h2>

              <p className="mt-4 max-w-md leading-7 text-white/50">
                No complicated process. List your item,
                connect with nearby buyers and complete
                your deal.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">

              {[
                [
                  "01",
                  "List your item",
                  "Add photos, price and details.",
                ],
                [
                  "02",
                  "Connect",
                  "Talk directly with interested buyers.",
                ],
                [
                  "03",
                  "Make the deal",
                  "Meet safely and complete the sale.",
                ],
              ].map(
                ([
                  number,
                  title,
                  text,
                ]) => (
                  <div
                    key={number}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >

                    <span className="text-sm font-black text-orange-400">
                      {number}
                    </span>

                    <h3 className="mt-8 font-bold">
                      {title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-white/45">
                      {text}
                    </p>

                  </div>
                )
              )}

            </div>

          </div>

        </div>
      </section>

      {/* =========================
          SELL CTA
      ========================= */}
      <section className="border-t border-zinc-200 bg-orange-50">

        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-5 py-14 sm:px-8 md:flex-row md:items-center lg:px-10">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e94d17]">
              Have something to sell?
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight">
              Turn unused stuff into money.
            </h2>

            <p className="mt-2 text-zinc-500">
              Your first listing is free. Start selling
              in minutes.
            </p>

          </div>

          <Link
            href="/sell"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#ff5a1f] px-6 py-3.5 font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-[#e94d17]"
          >
            Sell an item
            <ArrowIcon />
          </Link>

        </div>
      </section>

      {/* =========================
          FOOTER
      ========================= */}
      <footer className="bg-[#111111] text-white">

        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-4 lg:px-10">

          <div className="md:col-span-2">

            <Link
              href="/"
              className="flex items-center gap-2.5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff5a1f] font-black">
                S
              </div>

              <span className="text-lg font-extrabold">
                Saman
                <span className="text-[#ff5a1f]">
                  Becho
                </span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-white/45">
              A local marketplace where people can buy
              and sell pre-owned products easily, safely
              and at better prices.
            </p>

          </div>

          <div>

            <h3 className="text-sm font-bold">
              Marketplace
            </h3>

            <div className="mt-4 space-y-3 text-sm text-white/45">

              <p>Browse listings</p>

              <p>Categories</p>

              <Link
                href="/sell"
                className="block transition hover:text-white"
              >
                Sell an item
              </Link>

              <Link
                href="/favorites"
                className="block transition hover:text-white"
              >
                Saved items
              </Link>

              <Link
                href="/profile"
                className="block transition hover:text-white"
              >
                Profile
              </Link>

              <p>How it works</p>

            </div>

          </div>

          <div>

            <h3 className="text-sm font-bold">
              Support
            </h3>

            <div className="mt-4 space-y-3 text-sm text-white/45">

              <p>Safety tips</p>
              <p>Help center</p>
              <p>Contact us</p>
              <p>Privacy policy</p>

            </div>

          </div>

        </div>

        <div className="border-t border-white/10">

          <div className="mx-auto max-w-7xl px-5 py-5 text-xs text-white/35 sm:px-8 lg:px-10">
            © 2026 SamanBecho. Built for local communities.
          </div>

        </div>

      </footer>

    </main>
  );
}