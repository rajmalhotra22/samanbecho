require("dotenv").config({
  path: ".env.local",
});

const { MongoClient } = require("mongodb");

async function setAdmin() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI not found in .env.local"
    );
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();

    const db = client.db("samanbecho");

    const result = await db
      .collection("users")
      .updateOne(
        {
          phone: "6299410025",
        },
        {
          $set: {
            role: "admin",
          },
        }
      );

    console.log(
      "Matched:",
      result.matchedCount
    );

    console.log(
      "Modified:",
      result.modifiedCount
    );

    if (result.matchedCount === 0) {
      console.log("User not found.");
    } else {
      console.log(
        "Admin role assigned successfully."
      );
    }
  } catch (error) {
    console.error(
      "SET ADMIN ERROR:",
      error
    );
  } finally {
    await client.close();
  }
}

setAdmin();