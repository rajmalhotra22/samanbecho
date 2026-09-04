import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import client from "@/lib/mongodb";

// =========================
// GET AUTHENTICATED USER
// =========================
async function getAuthenticatedUser(
  request: Request
) {
  const cookieHeader =
    request.headers.get("cookie") || "";

  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) =>
      cookie.startsWith(
        "samanbecho_session="
      )
    );

  if (!sessionCookie) {
    return null;
  }

  const sessionToken =
    sessionCookie.substring(
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

  // =========================
  // CHECK SESSION EXPIRY
  // =========================
  if (
    session.expiresAt &&
    new Date(
      session.expiresAt
    ).getTime() <= Date.now()
  ) {
    await db
      .collection("sessions")
      .deleteOne({
        _id: session._id,
      });

    return null;
  }

  if (!session.userId) {
    return null;
  }

  const user = await db
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
    phone: String(
      user.phone || ""
    ).replace(/\D/g, ""),
    createdAt:
      user.createdAt || null,
  };
}

// =========================
// GET PROFILE
// =========================
export async function GET(
  request: Request
) {
  try {
    const user =
      await getAuthenticatedUser(
        request
      );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message:
            "Authentication required",
        },
        { status: 401 }
      );
    }

    await client.connect();

    const db =
      client.db("samanbecho");

    // =========================
    // USER LISTINGS
    // =========================
    const listings =
      await db
        .collection("listings")
        .find({
          sellerId: user.id,
        })
        .project({
          status: 1,
        })
        .toArray();

    const totalListings =
      listings.length;

    const soldListings =
      listings.filter(
        (item) =>
          item.status === "sold"
      ).length;

    const availableListings =
      totalListings -
      soldListings;

    // =========================
    // SAVED ITEMS
    // =========================
    const savedItems =
      await db
        .collection("favorites")
        .countDocuments({
          userId: user.id,
        });

    return NextResponse.json({
      success: true,
      authenticated: true,

      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        createdAt: user.createdAt
          ? new Date(
              user.createdAt
            ).toISOString()
          : null,
      },

      stats: {
        totalListings,
        availableListings,
        soldListings,
        savedItems,
      },
    });
  } catch (error) {
    console.error(
      "PROFILE GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load profile",
      },
      { status: 500 }
    );
  }
}

// =========================
// UPDATE PROFILE
// NAME ONLY
// =========================
export async function PATCH(
  request: Request
) {
  try {
    const user =
      await getAuthenticatedUser(
        request
      );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message:
            "Authentication required",
        },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const name =
      String(
        body.name || ""
      ).trim();

    // =========================
    // VALIDATION
    // =========================
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name is required",
        },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name must be at least 2 characters",
        },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name must be less than 50 characters",
        },
        { status: 400 }
      );
    }

    await client.connect();

    const db =
      client.db("samanbecho");

    // =========================
    // VALIDATE USER ID
    // =========================
    if (!ObjectId.isValid(user.id)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid user account",
        },
        { status: 400 }
      );
    }

    // =========================
    // UPDATE USER
    // =========================
    const result =
      await db
        .collection("users")
        .updateOne(
          {
            _id: new ObjectId(
              user.id
            ),
          },
          {
            $set: {
              name,
              updatedAt:
                new Date(),
            },
          }
        );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User account not found",
        },
        { status: 404 }
      );
    }

    // =========================
    // UPDATE EXISTING LISTINGS
    // =========================
    await db
      .collection("listings")
      .updateMany(
        {
          sellerId: user.id,
        },
        {
          $set: {
            sellerName: name,
            updatedAt:
              new Date(),
          },
        }
      );

    return NextResponse.json({
      success: true,
      message:
        "Profile updated successfully",

      user: {
        id: user.id,
        name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error(
      "PROFILE PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update profile",
      },
      { status: 500 }
    );
  }
}