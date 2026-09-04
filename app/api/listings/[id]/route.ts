import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import client from "@/lib/mongodb";

// =========================
// GET AUTHENTICATED USER ID
// =========================
async function getAuthenticatedUserId(
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

  // Check session expiry
  if (
    session.expiresAt &&
    new Date(session.expiresAt).getTime() <
      Date.now()
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

  return String(session.userId);
}

// =========================
// GET LISTING
// PUBLIC
// =========================
export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
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

    const listing = await db
      .collection("listings")
      .findOne({
        _id: new ObjectId(id),
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

    return NextResponse.json({
      success: true,
      listing: {
        id: listing._id.toString(),
        _id: listing._id.toString(),

        title: listing.title || "",

        price:
          Number(listing.price) || 0,

        category:
          listing.category || "",

        location:
          listing.location || "",

        condition:
          listing.condition || "Good",

        description:
          listing.description || "",

        photos:
          Array.isArray(listing.photos)
            ? listing.photos
            : [],

        sellerName:
          listing.sellerName || "",

        sellerPhone:
          listing.sellerPhone || "",

        sellerId:
          listing.sellerId || "",

        status:
          listing.status === "sold"
            ? "sold"
            : "available",

        createdAt:
          listing.createdAt
            ? new Date(
                listing.createdAt
              ).toISOString()
            : null,
      },
    });
  } catch (error) {
    console.error(
      "GET listing error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch listing",
      },
      { status: 500 }
    );
  }
}

// =========================
// UPDATE LISTING
// OWNER ONLY
// =========================
export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid listing ID",
        },
        { status: 400 }
      );
    }

    // =========================
    // AUTHENTICATION
    // =========================
    const userId =
      await getAuthenticatedUserId(
        request
      );

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

    // =========================
    // STATUS UPDATE
    // =========================
    if (
      body.status !== undefined
    ) {
      const status =
        String(body.status).trim();

      if (
        status !== "available" &&
        status !== "sold"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid listing status",
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
          .updateOne(
            {
              _id: new ObjectId(id),
              sellerId: userId,
            },
            {
              $set: {
                status,
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
              "Listing not found or you are not the owner",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          status === "sold"
            ? "Listing marked as sold"
            : "Listing marked as available",
        status,
      });
    }

    // =========================
    // NORMAL LISTING UPDATE
    // =========================
    const title =
      String(
        body.title || ""
      ).trim();

    const category =
      String(
        body.category || ""
      ).trim();

    const location =
      String(
        body.location || ""
      ).trim();

    const condition =
      String(
        body.condition || ""
      ).trim();

    const description =
      String(
        body.description || ""
      ).trim();

    const price =
      Number(body.price);

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
      price <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid price",
        },
        { status: 400 }
      );
    }

    await client.connect();

    const db = client.db("samanbecho");

    const result =
      await db
        .collection("listings")
        .updateOne(
          {
            _id: new ObjectId(id),
            sellerId: userId,
          },
          {
            $set: {
              title,
              price,
              category,
              location,
              condition,
              description,

              photos:
                Array.isArray(
                  body.photos
                )
                  ? body.photos
                  : [],

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
            "Listing not found or you are not the owner",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Listing updated successfully",
    });
  } catch (error) {
    console.error(
      "PUT listing error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update listing",
      },
      { status: 500 }
    );
  }
}

// =========================
// DELETE LISTING
// OWNER ONLY
// =========================
export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid listing ID",
        },
        { status: 400 }
      );
    }

    const userId =
      await getAuthenticatedUserId(
        request
      );

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

    const result =
      await db
        .collection("listings")
        .deleteOne({
          _id: new ObjectId(id),
          sellerId: userId,
        });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Listing not found or you are not the owner",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Listing deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE listing error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete listing",
      },
      { status: 500 }
    );
  }
}