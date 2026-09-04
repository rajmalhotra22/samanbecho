import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import client from "@/lib/mongodb";

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
    sessionCookie.split("=")[1];

  if (!sessionToken) {
    return null;
  }

  await client.connect();

  const db =
    client.db("samanbecho");

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
    new Date(session.expiresAt) <=
      new Date()
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

  return user;
}

export async function POST(
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
          message: "Please login first.",
        },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const currentPassword =
      String(
        body.currentPassword || ""
      );

    const newPassword =
      String(
        body.newPassword || ""
      );

    const confirmPassword =
      String(
        body.confirmPassword || ""
      );

    // =========================
    // VALIDATION
    // =========================

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "All password fields are required.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password and confirm password do not match.",
        },
        { status: 400 }
      );
    }

    if (
      currentPassword ===
      newPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be different from your current password.",
        },
        { status: 400 }
      );
    }

    // =========================
    // VERIFY CURRENT PASSWORD
    // =========================

    const passwordMatches =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Current password is incorrect.",
        },
        { status: 400 }
      );
    }

    // =========================
    // HASH NEW PASSWORD
    // =========================

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    // =========================
    // UPDATE PASSWORD
    // =========================

    const db =
      client.db("samanbecho");

    await db
      .collection("users")
      .updateOne(
        {
          _id: user._id,
        },
        {
          $set: {
            password:
              hashedPassword,
            updatedAt:
              new Date(),
          },
        }
      );

    // =========================
    // OPTIONAL SECURITY:
    // LOG OUT OTHER SESSIONS
    // =========================

    const cookieHeader =
      request.headers.get("cookie") ||
      "";

    const sessionCookie =
      cookieHeader
        .split(";")
        .map((cookie) =>
          cookie.trim()
        )
        .find((cookie) =>
          cookie.startsWith(
            "samanbecho_session="
          )
        );

    if (sessionCookie) {
      const currentToken =
        sessionCookie.split(
          "="
        )[1];

      if (currentToken) {
        await db
          .collection("sessions")
          .deleteMany({
            userId: user._id,
            token: {
              $ne: currentToken,
            },
          });
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Password changed successfully.",
    });
  } catch (error) {
    console.error(
      "CHANGE PASSWORD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to change password.",
      },
      { status: 500 }
    );
  }
}