"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: cleanPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Something went wrong.");
        return;
      }

      setMessage(
        "If this phone number is registered, a password reset process will be available soon."
      );
    } catch (err) {
      console.error(err);
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-sm text-gray-500 hover:text-black mb-6"
        >
          ← Back to Login
        </button>

        <h1 className="text-2xl font-bold text-gray-900">
          Forgot Password
        </h1>

        <p className="text-sm text-gray-500 mt-2 mb-6">
          Enter your registered phone number to start resetting your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>

            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, ""))
              }
              placeholder="Enter 10-digit phone number"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#ff5a1f]"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#ff5a1f] text-white py-3 font-semibold hover:bg-[#e94f17] disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}