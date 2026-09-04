"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SellPage() {
  const router = useRouter();

  const [checkingLogin, setCheckingLogin] = useState(true);

  const [photos, setPhotos] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("Like New");
  const [description, setDescription] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");

  const [sellerId, setSellerId] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // =========================
  // CHECK LOGIN + LOAD USER
  // =========================
  useEffect(() => {
    const loggedIn = localStorage.getItem(
      "samanbecho_logged_in"
    );

    if (loggedIn !== "true") {
      router.replace("/login");
      return;
    }

    const savedUserId = localStorage.getItem(
      "samanbecho_user_id"
    );

    const savedPhone = localStorage.getItem(
      "samanbecho_user_phone"
    );

    if (!savedUserId || !savedPhone) {
      setMessage(
        "User information missing. Please login again."
      );

      setTimeout(() => {
        router.replace("/login");
      }, 1000);

      return;
    }

    setSellerId(savedUserId);
    setSellerPhone(savedPhone);

    setCheckingLogin(false);
  }, [router]);

  // =========================
  // PHOTOS
  // =========================
  const handlePhotos = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  // =========================
  // FILE TO BASE64
  // =========================
  const fileToBase64 = (
    file: File
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(
            new Error("Failed to read image")
          );
        }
      };

      reader.onerror = () => {
        reject(
          new Error("Failed to read image")
        );
      };

      reader.readAsDataURL(file);
    });
  };

  // =========================
  // SUBMIT LISTING
  // =========================
  const handleSubmit = async () => {
    setMessage("");

    if (!sellerId) {
      setMessage(
        "Please login again before selling."
      );
      return;
    }

    if (
      !title.trim() ||
      !price ||
      !category ||
      !location.trim() ||
      !description.trim() ||
      !sellerPhone.trim()
    ) {
      setMessage(
        "Please fill all required fields."
      );
      return;
    }

    const cleanPhone = sellerPhone.replace(
      /\D/g,
      ""
    );

    if (cleanPhone.length !== 10) {
      setMessage(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    if (photos.length === 0) {
      setMessage(
        "Please upload at least one product photo."
      );
      return;
    }

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      setMessage("Please enter a valid price.");
      return;
    }

    try {
      setLoading(true);

      const photoData = await Promise.all(
        photos.map((photo) =>
          fileToBase64(photo)
        )
      );

      const response = await fetch(
        "/api/listings",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            price: numericPrice,
            category,
            location: location.trim(),
            condition,
            description: description.trim(),
            photos: photoData,

            // OWNER INFORMATION
            sellerId,
            sellerPhone: cleanPhone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to create listing"
        );
      }

      setMessage(
        "✅ Listing created successfully!"
      );

      // Reset product fields
      setPhotos([]);
      setTitle("");
      setPrice("");
      setCategory("");
      setLocation("");
      setCondition("Like New");
      setDescription("");
    } catch (error) {
      console.error(
        "Create listing error:",
        error
      );

      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Failed to create listing."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGIN CHECK SCREEN
  // =========================
  if (checkingLogin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <p className="font-semibold text-zinc-700">
          Checking login...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-5 py-10 text-zinc-900">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-zinc-900">
              Sell your item
            </h1>

            <p className="mt-2 text-zinc-600">
              Add photos and details of your product.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-900 hover:bg-zinc-50"
          >
            ← Home
          </button>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">

          {/* PHOTOS */}
          <div>
            <h2 className="text-lg font-bold text-zinc-900">
              Product Photos
            </h2>

            <p className="mt-1 text-sm text-zinc-600">
              Add clear photos of your product.
            </p>

            <label className="mt-4 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 transition hover:border-[#ff5a1f] hover:bg-orange-50">
              <span className="text-4xl">
                📸
              </span>

              <span className="mt-3 font-bold text-zinc-900">
                Add Photos
              </span>

              <span className="mt-1 text-xs text-zinc-500">
                Camera or Gallery
              </span>

              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handlePhotos}
                className="hidden"
              />
            </label>

            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map(
                  (photo, index) => (
                    <div
                      key={`${photo.name}-${index}`}
                      className="overflow-hidden rounded-xl border border-zinc-200"
                    >
                      <img
                        src={URL.createObjectURL(
                          photo
                        )}
                        alt={`Product ${
                          index + 1
                        }`}
                        className="h-32 w-full object-cover"
                      />
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* PRODUCT NAME */}
          <div className="mt-8">
            <label className="text-sm font-bold text-zinc-900">
              Product Name
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="e.g. iPhone 17"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#ff5a1f]"
            />
          </div>

          {/* PRICE */}
          <div className="mt-5">
            <label className="text-sm font-bold text-zinc-900">
              Price
            </label>

            <input
              type="number"
              min="1"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
              placeholder="e.g. 35000"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#ff5a1f]"
            />
          </div>

          {/* CATEGORY */}
          <div className="mt-5">
            <label className="text-sm font-bold text-zinc-900">
              Category
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-[#ff5a1f]"
            >
              <option
                value=""
                className="text-zinc-500"
              >
                Select category
              </option>

              <option value="Mobiles">
                Mobiles
              </option>

              <option value="Laptops">
                Laptops
              </option>

              <option value="Bikes">
                Bikes
              </option>

              <option value="Books">
                Books
              </option>

              <option value="Furniture">
                Furniture
              </option>

              <option value="Electronics">
                Electronics
              </option>

              <option value="Fashion">
                Fashion
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          {/* LOCATION */}
          <div className="mt-5">
            <label className="text-sm font-bold text-zinc-900">
              Location
            </label>

            <input
              type="text"
              value={location}
              onChange={(e) =>
                setLocation(e.target.value)
              }
              placeholder="e.g. Patna"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#ff5a1f]"
            />
          </div>

          {/* SELLER PHONE */}
          <div className="mt-5">
            <label className="text-sm font-bold text-zinc-900">
              Mobile Number
            </label>

            <input
              type="tel"
              value={sellerPhone}
              onChange={(e) => {
                const value =
                  e.target.value.replace(
                    /\D/g,
                    ""
                  );

                setSellerPhone(
                  value.slice(0, 10)
                );
              }}
              maxLength={10}
              placeholder="9876543210"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#ff5a1f]"
            />

            <p className="mt-1 text-xs text-zinc-500">
              This number will be shown to buyers.
            </p>
          </div>

          {/* CONDITION */}
          <div className="mt-5">
            <label className="text-sm font-bold text-zinc-900">
              Condition
            </label>

            <select
              value={condition}
              onChange={(e) =>
                setCondition(e.target.value)
              }
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-[#ff5a1f]"
            >
              <option value="Like New">
                Like New
              </option>

              <option value="Excellent">
                Excellent
              </option>

              <option value="Good">
                Good
              </option>

              <option value="Fair">
                Fair
              </option>
            </select>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-5">
            <label className="text-sm font-bold text-zinc-900">
              Description
            </label>

            <textarea
              rows={5}
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Tell buyers about your product..."
              className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#ff5a1f]"
            />
          </div>

          {/* MESSAGE */}
          {message && (
            <div
              className={`mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${
                message.startsWith("✅")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message}
            </div>
          )}

          {/* POST BUTTON */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-[#ff5a1f] py-4 font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-[#e94d17] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Posting Listing..."
              : "Post Listing"}
          </button>
        </div>
      </div>
    </main>
  );
}