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
    phone: String(user.phone || ""),
  };
}

// =========================
// CREATE REPORT
// =========================
export async function POST(
  request: Request
) {
  try {
    const user =
      await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login to report a listing",
        },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const listingId = String(
      body.listingId || ""
    ).trim();

    const reason = String(
      body.reason || ""
    ).trim();

    const details = String(
      body.details || ""
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

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a report reason",
        },
        { status: 400 }
      );
    }

    await client.connect();

    const db =
      client.db("samanbecho");

    // Make sure listing exists
    const listing =
      await db
        .collection("listings")
        .findOne({
          _id: new ObjectId(
            listingId
          ),
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

    const reports =
      db.collection("reports");

    // Prevent duplicate report by same user
    const existingReport =
      await reports.findOne({
        userId: user.id,
        listingId,
      });

    if (existingReport) {
      return NextResponse.json({
        success: true,
        message:
          "You have already reported this listing",
      });
    }

    await reports.insertOne({
      userId: user.id,
      userName: user.name,
      listingId,

      reason,
      details,

      status: "pending",

      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message:
        "Report submitted successfully",
    });
  } catch (error) {
    console.error(
      "Create report error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to submit report",
      },
      { status: 500 }
    );
  }
}