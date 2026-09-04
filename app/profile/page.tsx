"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  phone: string;
  createdAt?: string | null;
};

type Stats = {
  total: number;
  available: number;
  sold: number;
  savedItems: number;
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  const [stats, setStats] = useState<Stats>({
    total: 0,
    available: 0,
    sold: 0,
    savedItems: 0,
  });

  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);

  const [name, setName] = useState("");
  const [editMode, setEditMode] = useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/profile",
        {
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "We couldn't load your profile."
        );
      }

      setUser(data.user);
      setStats(data.stats);
      setName(data.user.name || "");
    } catch (err) {
      console.error(
        "PROFILE LOAD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "We couldn't load your profile."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleNameSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    try {
      setSavingName(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update profile."
        );
      }

      setUser(data.user);
      setName(data.user.name);
      setEditMode(false);

      setMessage(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "PROFILE UPDATE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update profile."
      );
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!currentPassword) {
      setError(
        "Please enter your current password."
      );
      return;
    }

    if (!newPassword) {
      setError(
        "Please enter your new password."
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (!confirmPassword) {
      setError(
        "Please confirm your new password."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "New password and confirm password do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(
        "/api/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to change password."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage(
        "Password changed successfully."
      );
    } catch (err) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  function maskPhone(phone: string) {
    if (!phone) return "";

    const digits = phone.replace(
      /\D/g,
      ""
    );

    if (digits.length !== 10) {
      return phone;
    }

    return `${digits.slice(
      0,
      2
    )}******${digits.slice(-2)}`;
  }

  function formatDate(
    date?: string | null
  ) {
    if (!date) return "Recently";

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Recently";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">

          <div className="animate-pulse space-y-6">

            <div className="h-5 w-36 rounded bg-zinc-200" />

            <div className="h-10 w-52 rounded bg-zinc-200" />

            <div className="h-56 rounded-[2rem] bg-zinc-200" />

            <div className="h-40 rounded-[2rem] bg-zinc-200" />

          </div>

        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">

      {/* =========================
          HEADER
      ========================= */}
      <header className="border-b border-black/5 bg-white">

        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">

          {/* LOGO */}
          <Link
            href="/"
            className="flex items-center gap-2.5"
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

          <Link
            href="/"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-[#ff5a1f]"
          >
            ← Home
          </Link>

        </div>

      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-12">

        {/* =========================
            PAGE HEADER
        ========================= */}
        <div className="mb-8">

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5a1f]">
            Account
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            My Profile
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500 sm:text-base">
            Manage your account and marketplace activity.
          </p>

        </div>

        {/* =========================
            MESSAGES
        ========================= */}
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* =========================
            PROFILE CARD
        ========================= */}
        <section className="mb-6 overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">

          {/* ORANGE TOP */}
          <div className="h-24 bg-gradient-to-r from-orange-50 via-white to-orange-100 sm:h-28" />

          <div className="px-5 pb-6 sm:px-7">

            <div className="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end">

              {/* AVATAR */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#ff5a1f] text-3xl font-black text-white shadow-xl">
                {user.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1 pb-1">

                {editMode ? (
                  <form
                    onSubmit={
                      handleNameSave
                    }
                    className="flex flex-col gap-3 sm:flex-row sm:items-center"
                  >

                    <input
                      type="text"
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value
                        )
                      }
                      maxLength={50}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-lg font-bold text-zinc-900 outline-none transition focus:border-[#ff5a1f] focus:bg-white focus:ring-4 focus:ring-orange-100 sm:max-w-sm"
                    />

                    <button
                      type="submit"
                      disabled={
                        savingName
                      }
                      className="rounded-xl bg-[#ff5a1f] px-5 py-3 font-bold text-white shadow-lg shadow-orange-100 transition hover:bg-[#e94d17] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingName
                        ? "Saving..."
                        : "Save"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setName(
                          user.name
                        );
                        setError("");
                      }}
                      className="rounded-xl border border-zinc-200 bg-white px-5 py-3 font-bold text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Cancel
                    </button>

                  </form>
                ) : (
                  <>
                    <h2 className="text-2xl font-black text-zinc-900">
                      {user.name}
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      SamanBecho member
                    </p>
                  </>
                )}

              </div>

              {!editMode && (
                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setError("");
                    setEditMode(true);
                  }}
                  className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-bold text-[#e94d17] transition hover:bg-orange-100"
                >
                  Edit Name
                </button>
              )}

            </div>

            {/* USER DETAILS */}
            <div className="mt-7 grid gap-4 sm:grid-cols-2">

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">

                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  Phone Number
                </p>

                <p className="mt-2 font-bold text-zinc-900">
                  {maskPhone(
                    user.phone
                  )}
                </p>

              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">

                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  Member Since
                </p>

                <p className="mt-2 font-bold text-zinc-900">
                  {formatDate(
                    user.createdAt
                  )}
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =========================
            STATS
        ========================= */}
        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm font-semibold text-zinc-500">
                Total Listings
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-lg">
                📦
              </span>

            </div>

            <p className="mt-4 text-3xl font-black text-zinc-900">
              {stats.total}
            </p>

          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm font-semibold text-zinc-500">
                Available
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-lg">
                🟢
              </span>

            </div>

            <p className="mt-4 text-3xl font-black text-emerald-600">
              {stats.available}
            </p>

          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm font-semibold text-zinc-500">
                Sold
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-lg">
                ✓
              </span>

            </div>

            <p className="mt-4 text-3xl font-black text-red-500">
              {stats.sold}
            </p>

          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm font-semibold text-zinc-500">
                Saved Items
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-lg">
                ❤️
              </span>

            </div>

            <p className="mt-4 text-3xl font-black text-pink-500">
              {stats.savedItems}
            </p>

          </div>

        </section>

        {/* =========================
            QUICK ACTIONS
        ========================= */}
        <section className="mb-6 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">

          <div className="mb-5">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5a1f]">
              Marketplace
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Quick Actions
            </h2>

          </div>

          <div className="grid gap-3 sm:grid-cols-3">

            <Link
              href="/my-listings"
              className="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 hover:shadow-lg hover:shadow-orange-100"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-50 text-xl transition group-hover:bg-white">
                📦
              </div>

              <p className="mt-4 font-black text-zinc-900">
                My Listings
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Manage your ads
              </p>
            </Link>

            <Link
              href="/favorites"
              className="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-pink-200 hover:bg-pink-50 hover:shadow-lg hover:shadow-pink-100"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-50 text-xl transition group-hover:bg-white">
                ❤️
              </div>

              <p className="mt-4 font-black text-zinc-900">
                Saved Items
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                View your favorites
              </p>
            </Link>

            <Link
              href="/sell"
              className="group rounded-2xl bg-[#ff5a1f] p-5 text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-[#e94d17]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xl">
                🏷️
              </div>

              <p className="mt-4 font-black">
                Sell an Item
              </p>

              <p className="mt-1 text-sm text-white/70">
                Create a new listing
              </p>
            </Link>

          </div>

        </section>

        {/* =========================
            CHANGE PASSWORD
        ========================= */}
        <section className="mb-6 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">

          <div className="mb-6">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff5a1f]">
              Security
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Change Password
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Change your account password using your current password.
            </p>

          </div>

          <form
            onSubmit={
              handleChangePassword
            }
            className="max-w-xl space-y-4"
          >

            <div>

              <label className="mb-2 block text-sm font-bold text-zinc-700">
                Current Password
              </label>

              <input
                type="password"
                value={
                  currentPassword
                }
                onChange={(event) =>
                  setCurrentPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
                placeholder="Enter current password"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900 outline-none transition focus:border-[#ff5a1f] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-bold text-zinc-700">
                New Password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                placeholder="Minimum 6 characters"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900 outline-none transition focus:border-[#ff5a1f] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-bold text-zinc-700">
                Confirm New Password
              </label>

              <input
                type="password"
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900 outline-none transition focus:border-[#ff5a1f] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />

            </div>

            <button
              type="submit"
              disabled={
                changingPassword
              }
              className="rounded-xl bg-[#ff5a1f] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-[#e94d17] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changingPassword
                ? "Changing Password..."
                : "Change Password"}
            </button>

          </form>

          <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-4">

            <p className="text-sm leading-6 text-[#b83c0f]">
              <strong>
                Note:
              </strong>{" "}
              This option works when you know your current password.
              Forgot-password OTP recovery will be added separately later.
            </p>

          </div>

        </section>

        {/* =========================
            ACCOUNT
        ========================= */}
        <section className="rounded-[2rem] border border-red-100 bg-white p-5 shadow-sm sm:p-7">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-500">
                Account
              </p>

              <h2 className="mt-2 text-xl font-black">
                Sign out
              </h2>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Sign out from your SamanBecho account on this device.
              </p>

            </div>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="rounded-xl border border-red-200 bg-red-50 px-6 py-3.5 text-sm font-bold text-red-600 transition hover:bg-red-100"
            >
              Logout
            </button>

          </div>

        </section>

      </div>

    </main>
  );
}