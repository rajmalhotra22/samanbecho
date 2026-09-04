import { NextResponse } from "next/server";
import client from "@/lib/mongodb";

async function getAuthenticatedUser(request: Request) {
  const cookieHeader =
    request.headers.get("cookie") || "";

  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) =>
      cookie.startsWith("samanbecho_session=")
    );

  if (!sessionCookie) {
    return null;
  }

  const sessionToken =
    sessionCookie.split("=")[1];

  if (!sessionToken) {
    return null;
  }

  await client.connect();

  const db = client.db("samanbecho");

  const session =
    await db
      .collection("sessions")
      .findOne({
        token: sessionToken,
      });

  if (!session) {
    return null;
  }

  if (
    session.expiresAt &&
    new Date(session.expiresAt).getTime() <
      Date.now()
  ) {
    await db
      .collection("sessions")
      .deleteOne({
        token: sessionToken,
      });

    return null;
  }

  const user =
    await db
      .collection("users")
      .findOne({
        _id: session.userId,
      });

  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: String(user.name || ""),
    phone: String(user.phone || ""),
  };
}

// =========================
// GET LISTINGS
// =========================
export async function GET(request: Request) {
  try {
    await client.connect();

    const db = client.db("samanbecho");

    const { searchParams } =
      new URL(request.url);

    const mine =
      searchParams.get("mine") === "true";

    let query = {};

    // =========================
    // MY LISTINGS
    // =========================
    if (mine) {
      const user =
        await getAuthenticatedUser(request);

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message: "Unauthorized",
          },
          { status: 401 }
        );
      }

      query = {
        sellerId: user.id,
      };
    }

    const listings =
      await db
        .collection("listings")
        .find(query)
        .sort({
          createdAt: -1,
        })
        .toArray();

    const formattedListings =
      listings.map((listing) => ({
        id: listing._id.toString(),
        _id: listing._id.toString(),

        title: String(
          listing.title || ""
        ),

        price:
          Number(listing.price) || 0,

        category: String(
          listing.category || ""
        ),

        location: String(
          listing.location || ""
        ),

        condition: String(
          listing.condition || ""
        ),

        description: String(
          listing.description || ""
        ),

        photos:
          Array.isArray(listing.photos)
            ? listing.photos
            : [],

        sellerPhone: String(
          listing.sellerPhone || ""
        ),

        sellerName: String(
          listing.sellerName || ""
        ),

        sellerId: String(
          listing.sellerId || ""
        ),

        status:
          listing.status === "sold"
            ? "sold"
            : "available",

        // =========================
        // VIEW COUNT
        // =========================
        views:
          Number(listing.views) || 0,

        createdAt:
          listing.createdAt || null,
      }));

    return NextResponse.json({
      success: true,
      listings: formattedListings,
    });
  } catch (error) {
    console.error(
      "GET LISTINGS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch listings",
      },
      { status: 500 }
    );
  }
}

// =========================
// CREATE LISTING
// =========================
export async function POST(request: Request) {
  try {
    const user =
      await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const title =
      String(body.title || "").trim();

    const price =
      Number(body.price);

    const category =
      String(body.category || "").trim();

    const location =
      String(body.location || "").trim();

    const condition =
      String(body.condition || "").trim();

    const description =
      String(
        body.description || ""
      ).trim();

    if (
      !title ||
      !category ||
      !location ||
      !condition ||
      !description
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please fill all required fields",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid price",
        },
        { status: 400 }
      );
    }

    await client.connect();

    const db =
      client.db("samanbecho");

    const result =
      await db
        .collection("listings")
        .insertOne({
          title,
          price,
          category,
          location,
          condition,
          description,

          photos:
            Array.isArray(body.photos)
              ? body.photos
              : [],

          sellerId: user.id,
          sellerPhone: user.phone,
          sellerName: user.name,

          status: "available",

          // New listing starts with 0 views
          views: 0,

          createdAt: new Date(),
          updatedAt: new Date(),
        });

    return NextResponse.json({
      success: true,
      message:
        "Listing created successfully",

      listingId:
        result.insertedId.toString(),
    });
  } catch (error) {
    console.error(
      "CREATE LISTING ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create listing",
      },
      { status: 500 }
    );
  }
}