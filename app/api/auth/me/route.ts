import { NextResponse } from "next/server";
import client from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const cookieHeader =
      request.headers.get("cookie") || "";

    const cookies = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim());

    const sessionCookie = cookies.find((cookie) =>
      cookie.startsWith("samanbecho_session=")
    );

    if (!sessionCookie) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    const sessionToken =
      sessionCookie.split("=")[1];

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Invalid session",
        },
        { status: 401 }
      );
    }

    await client.connect();

    const db = client.db("samanbecho");

    const session = await db
      .collection("sessions")
      .findOne({
        token: sessionToken,
      });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Session not found",
        },
        { status: 401 }
      );
    }

    // Expired session
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

      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "Session expired",
        },
        { status: 401 }
      );
    }

    const user = await db.collection("users").findOne({
      _id: session.userId,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: "User not found",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user._id.toString(),
        name: String(user.name || ""),
        phone: String(user.phone || ""),
        role: String(user.role || "user"),
      },
    });
  } catch (error) {
    console.error("ME API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        message: "Failed to get current user",
      },
      { status: 500 }
    );
  }
}