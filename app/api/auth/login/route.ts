import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { randomUUID } from "crypto";
import client from "@/lib/mongodb";

const SESSION_DAYS = 7;
const SESSION_MS =
  SESSION_DAYS * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");

    if (!phone || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Phone number and password are required",
        },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid 10-digit phone number",
        },
        { status: 400 }
      );
    }

    await client.connect();

    const db = client.db("samanbecho");

    const users = db.collection("users");
    const sessions = db.collection("sessions");

    // =========================
    // FIND USER
    // =========================

    const user = await users.findOne({
      phone: cleanPhone,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid phone number or password",
        },
        { status: 401 }
      );
    }

    // =========================
    // VERIFY PASSWORD
    // =========================

    const passwordHash = String(
      user.password || ""
    );

    const passwordValid = await compare(
      password,
      passwordHash
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid phone number or password",
        },
        { status: 401 }
      );
    }

    // =========================
    // CREATE SESSION
    // =========================

    const sessionToken = randomUUID();

    const expiresAt = new Date(
      Date.now() + SESSION_MS
    );

    await sessions.insertOne({
      token: sessionToken,
      userId: user._id,
      createdAt: new Date(),
      expiresAt,
    });

    // =========================
    // RESPONSE
    // =========================

    const response = NextResponse.json({
      success: true,
      message: "Login successful",

      user: {
        id: user._id.toString(),
        name: String(user.name || ""),
        phone: String(user.phone || ""),
      },
    });

    // =========================
    // HTTP ONLY COOKIE
    // =========================

    response.cookies.set({
      name: "samanbecho_session",
      value: sessionToken,

      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",

      path: "/",

      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Login failed",
      },
      { status: 500 }
    );
  }
}