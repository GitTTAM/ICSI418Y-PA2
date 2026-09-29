const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
    throw new Error("MONGO_URI is missing from server/.env");
}

const client = new MongoClient(mongoUri);

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.json({
        message: "Server is running"
    });
});

async function connectDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Could not connect to MongoDB");
        console.error(error);
        throw error;
    }
}

async function startServer() {
    try {
        await connectDatabase();

        const server = app.listen(9000, () => {
            console.log("Server running on port 9000");
        });

        const shutdown = () => {
            server.close(async () => {
                try {
                    await client.close();
                    console.log("Disconnected from MongoDB.");
                } catch (err) {
                    console.error("Error disconnecting from MongoDB:", err.message);
                    process.exitCode = 1;
                }
            });
        };

        process.once("SIGINT", shutdown);
        process.once("SIGTERM", shutdown);
    } catch (err) {
        console.error("Unable to start server:", err.message);
        process.exitCode = 1;
    }
}

startServer();