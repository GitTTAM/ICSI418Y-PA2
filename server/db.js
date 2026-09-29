const path = require("path");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

dotenv.config({ path: path.join(__dirname, ".env") });

const uri = process.env.MONGO_URI;

if (!uri) {
    throw new Error("MONGO_URI is missing from server/.env");
}

const client = new MongoClient(uri);

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.error("Could not connect to MongoDB:", err.message);
        throw err;
    }
}

async function disconnectFromMongoDB() {
    await client.close();
}

module.exports = { connectToMongoDB, disconnectFromMongoDB };