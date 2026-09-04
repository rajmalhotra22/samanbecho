import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import client from "@/lib/mongodb";

// =========================
// GET CURRENT USER ID
// =========================
async function getAuthenticatedUserId(
  request: Request
): Promise<string | null> {
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

  const sessionToken = sessionCookie.substring(
    "samanbecho_session=".length
  );

  if (!sessionToken) {
    return null;
  }

  await client.connect();

  const db = client.db("samanbecho");

  const session = await db
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
    await db.collection("sessions").deleteOne({
      _id: session._id,
    });

    return null;
  }

  if (!session.userId) {
    return null;
  }

  return String(session.userId);
}

// =========================
// GET FAVORITES
// =========================
export async function GET(request: Request) {
  try {
    const userId =
      await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    await client.connect();

    const db = client.db("samanbecho");

    const favorites = await db
      .collection("favorites")
      .find({
        userId,
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    const favoriteIds = favorites
      .map((item) => String(item.listingId))
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      favoriteIds,
    });
  } catch (error) {
    console.error(
      "GET favorites error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch favorites",
      },
      { status: 500 }
    );
  }
}

// =========================
// ADD FAVORITE
// =========================
export async function POST(request: Request) {
  try {
    const userId =
      await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const listingId = String(
      body.listingId || ""
    ).trim();

    if (
      !listingId ||
      !ObjectId.isValid(listingId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid listing ID",
        },
        { status: 400 }
      );
    }

    await client.connect();

    const db = client.db("samanbecho");

    // Make sure listing exists
    const listing = await db
      .collection("listings")
      .findOne({
        _id: new ObjectId(listingId),
      });

    if (!listing) {
      return NextResponse.json(
        {
          success: false,
          message: "Listing not found",
        },
        { status: 404 }
      );
    }

    const favorites =
      db.collection("favorites");

    // Prevent duplicate favorite
    const existingFavorite =
      await favorites.findOne({
        userId,
        listingId,
      });

    if (existingFavorite) {
      return NextResponse.json({
        success: true,
        message: "Listing already saved",
      });
    }

    await favorites.insertOne({
      userId,
      listingId,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Listing saved",
    });
  } catch (error) {
    console.error(
      "POST favorite error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save listing",
      },
      { status: 500 }
    );
  }
}

// =========================
// REMOVE FAVORITE
// =========================
export async function DELETE(
  request: Request
) {
  try {
    const userId =
      await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const listingId = String(
      body.listingId || ""
    ).trim();

    if (
      !listingId ||
      !ObjectId.isValid(listingId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid listing ID",
        },
        { status: 400 }
      );
    }

    await client.connect();

    const db = client.db("samanbecho");

    const result = await db
      .collection("favorites")
      .deleteOne({
        userId,
        listingId,
      });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: true,
        message: "Listing was not saved",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Listing removed from saved",
    });
  } catch (error) {
    console.error(
      "DELETE favorite error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to remove favorite",
      },
      { status: 500 }
    );
  }
}