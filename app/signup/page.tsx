"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!name.trim() || !phone.trim() || !password.trim()) {
      setError("Please fill all fields");
      return;
    }

    if (phone.trim().length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Signup failed");
        return;
      }

      alert("Account created successfully! 🎉");
      localStorage.setItem("user", name);

      router.push("/login");
    } catch (error) {
      console.error("Signup error:", error);
      setError("Something went wrong. Please try again.");
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
            Create account
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Join SamanBecho and start selling
          </p>

        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSignup} className="mt-8 space-y-5">

          {/* NAME */}
          <div>
            <label className="text-sm font-bold">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              disabled={loading}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none focus:border-[#ff5a1f] focus:bg-white focus:ring-4 focus:ring-orange-100 disabled:opacity-60"
            />
          </div>

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
              disabled={loading}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none focus:border-[#ff5a1f] focus:bg-white focus:ring-4 focus:ring-orange-100 disabled:opacity-60"
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
              placeholder="Create a password"
              disabled={loading}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none focus:border-[#ff5a1f] focus:bg-white focus:ring-4 focus:ring-orange-100 disabled:opacity-60"
            />
          </div>

          {/* SIGNUP */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#ff5a1f] py-3.5 font-bold text-white transition hover:bg-[#e94d17] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        {/* LOGIN */}
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-bold text-[#ff5a1f] hover:underline"
          >
            Login
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