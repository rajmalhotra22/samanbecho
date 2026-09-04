import { NextResponse } from "next/server";
import client from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const phone = String(body.phone || "").trim();
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 10-digit phone number.",
        },
        { status: 400 }
      );
    }

    await client.connect();

    const db = client.db("samanbecho");
    const users = db.collection("users");

    const user = await users.findOne({
      phone: cleanPhone,
    });

    /*
      Security:
      Registered/unregistered number ka exact status
      expose nahi karenge.
    */
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "If this phone number is registered, a password reset process will be available soon.",
      });
    }

    /*
      IMPORTANT:
      Abhi actual OTP/SMS provider connected nahi hai.
      Isliye yahan password reset nahi kar rahe.
    */

    return NextResponse.json({
      success: true,
      message:
        "Your number is registered. OTP verification will be required to reset your password.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process password reset request.",
      },
      { status: 500 }
    );
  }
}