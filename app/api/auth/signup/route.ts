import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import client from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");

    if (!name || !phone || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid 10-digit phone number",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    await client.connect();

    const db = client.db("samanbecho");

    const users = db.collection("users");

    // Check duplicate phone number
    const existingUser = await users.findOne({
      phone: cleanPhone,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number already registered",
        },
        { status: 409 }
      );
    }

    // Hash password before saving
    const passwordHash = await hash(password, 12);

    const newUser = {
      name,
      phone: cleanPhone,
      password: passwordHash,
      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      userId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create account",
      },
      { status: 500 }
    );
  }
}