"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Login failed");
        return;
      }

      // Login status save
      localStorage.setItem("samanbecho_logged_in", "true");
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

      // User ka actual name save
      const userName =
        data.user?.name ||
        data.userName ||
        "User";

      localStorage.setItem("samanbecho_user_name", userName);
      localStorage.setItem(
  "samanbecho_user_phone",
  phone
);

      alert("Login successful!");

      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-5">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-7 shadow-xl sm:p-9">

        {/* LOGO */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff5a1f] text-2xl font-black text-white">
            S
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Login to your SamanBecho account
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="mt-8 space-y-5">

          {/* PHONE */}
          <div>
            <label className="text-sm font-bold">
              Phone Number
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none focus:border-[#ff5a1f] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm font-bold">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none focus:border-[#ff5a1f] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="text-right">
  <button
    type="button"
    onClick={() => router.push("/forgot-password")}
    className="text-sm font-semibold text-[#ff5a1f] hover:underline"
  >
    Forgot Password?
  </button>
</div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#ff5a1f] py-3.5 font-bold text-white transition hover:bg-[#e94d17] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        {/* SIGNUP */}
        <p className="mt-6 text-center text-sm text-zinc-500">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="font-bold text-[#ff5a1f] hover:underline"
          >
            Create Account
          </button>
        </p>

        {/* HOME */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-4 w-full text-sm font-semibold text-zinc-500 hover:text-[#ff5a1f]"
        >
          ← Back to Home
        </button>

      </div>
    </main>
  );
}