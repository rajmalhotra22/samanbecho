import { NextResponse } from "next/server";
import client from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const cookieHeader =
      request.headers.get("cookie") || "";

    const sessionCookie = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) =>
        cookie.startsWith("samanbecho_session=")
      );

    await client.connect();

    const db = client.db("samanbecho");

    // Agar session cookie hai to MongoDB session delete karo
    if (sessionCookie) {
      const sessionToken =
        sessionCookie.split("=")[1];

      if (sessionToken) {
        await db
          .collection("sessions")
          .deleteOne({
            token: sessionToken,
          });
      }
    }

    // Browser cookie clear karo
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.set({
      name: "samanbecho_session",
      value: "",
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Logout failed",
      },
      { status: 500 }
    );
  }
}