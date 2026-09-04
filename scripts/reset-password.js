require("dotenv").config({
  path: ".env.local",
});

const { MongoClient } = require("mongodb");

async function resetPassword() {
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
        { phone: "6299410025" },
        {
          $set: {
            password:
              "$2b$12$yXI/0P.rOf6ujz7OTvSGoeklDKj1HO.AG5ZMZcfuLAG3wDkkJzDeW",
          },
        }
      );

    console.log("Matched:", result.matchedCount);
    console.log("Modified:", result.modifiedCount);

    if (result.matchedCount === 0) {
      console.log("User not found.");
    } else {
      console.log("Password reset successfully.");
    }
  } catch (error) {
    console.error("RESET ERROR:", error);
  } finally {
    await client.close();
  }
}

resetPassword();