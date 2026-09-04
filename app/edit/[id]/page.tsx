"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

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
};

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "",
    location: "",
    condition: "",
    description: "",
    photos: [] as string[],
    sellerPhone: "",
  });

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/listings/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to fetch listing"
          );
        }

        const listing: Listing = data.listing;

        setFormData({
          title: listing.title || "",
          price: String(listing.price || ""),
          category: listing.category || "",
          location: listing.location || "",
          condition: listing.condition || "",
          description: listing.description || "",
          photos: listing.photos || [],
          sellerPhone: listing.sellerPhone || "",
        });
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load listing"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id]);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/listings/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            price: Number(formData.price),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update listing"
        );
      }

      router.push("/my-listings");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update listing"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Loading listing...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-[72px] max-w-4xl items-center justify-between px-5">
          <Link
            href="/my-listings"
            className="font-bold"
          >
            ← Back
          </Link>

          <h1 className="text-xl font-black">
            Edit Listing
          </h1>

          <div className="w-12" />
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-5 py-10">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-3xl bg-white p-6 shadow-sm"
        >
          <h2 className="text-2xl font-black">
            Edit your item
          </h2>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block font-bold">
              Title
            </label>

            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">
              Price
            </label>

            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">
              Category
            </label>

            <input
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">
              Location
            </label>

            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">
              Condition
            </label>

            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              required
              className="w-full rounded-xl border p-3"
            >
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Used">Used</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-bold">
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">
              Mobile Number
            </label>

            <input
              name="sellerPhone"
              value={formData.sellerPhone}
              onChange={handleChange}
              required
              maxLength={10}
              className="w-full rounded-xl border p-3"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-[#ff5a1f] py-3 font-bold text-white disabled:opacity-60"
          >
            {saving
              ? "Saving Changes..."
              : "Save Changes"}
          </button>
        </form>
      </section>
    </main>
  );
}