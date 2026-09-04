import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import client from "@/lib/mongodb";

export async function POST(
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

    const db =
      client.db("samanbecho");

    // =========================
    // CHECK LISTING
    // =========================
    const listing =
      await db
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

    // =========================
    // INCREMENT VIEW COUNT
    // =========================
    const result =
      await db
        .collection("listings")
        .findOneAndUpdate(
          {
            _id: new ObjectId(id),
          },
          {
            $inc: {
              views: 1,
            },
          },
          {
            returnDocument: "after",
          }
        );

    const views =
      Number(
        result?.views
      ) || 0;

    return NextResponse.json({
      success: true,
      views,
    });
  } catch (error) {
    console.error(
      "LISTING VIEW ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to record listing view",
      },
      { status: 500 }
    );
  }
}