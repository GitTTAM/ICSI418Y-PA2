const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const mongoUri = process.env.MONGO_URI;
const port = process.env.PORT || 9000;
const databaseName = process.env.MONGO_DB || "pa2";

if (!mongoUri) {
    throw new Error("MONGO_URI is missing from server/.env");
}

const client = new MongoClient(mongoUri);
let usersCollection;

const app = express();

app.use(express.json());
app.use(cors());

function isBlank(value) {
    return typeof value !== "string" || value.trim() === "";
}

function normalizeUsername(username) {
    return username.trim().toLowerCase();
}

function publicUser(user) {
    return {
        _id: user._id,
        f_name: user.f_name,
        l_name: user.l_name,
        username: user.username
    };
}

app.get("/", (req, res) => {
    res.json({
        message: "Server is running"
    });
});

app.get("/username/:username", async (req, res) => {
    const { username } = req.params;

    if (isBlank(username)) {
        return res.status(400).json({
            message: "Username is required."
        });
    }

    try {
        const existingUser = await usersCollection.findOne({
            username: normalizeUsername(username)
        });

        return res.json({
            available: !existingUser
        });
    } catch (error) {
        console.error("Username check error:", error);
        return res.status(500).json({
            message: "A database or server error occurred during username check."
        });
    }
});

app.post("/signup", async (req, res) => {
    const { f_name, l_name, username, password } = req.body;

    if ([f_name, l_name, username, password].some(isBlank)) {
        return res.status(400).json({
            message: "Please fill in all signup fields."
        });
    }

    const normalizedUsername = normalizeUsername(username);

    try {
        const existingUser = await usersCollection.findOne({
            username: normalizedUsername
        });

        if (existingUser) {
            return res.status(409).json({
                message: "That username already exists."
            });
        }

        const newUser = {
            f_name: f_name.trim(),
            l_name: l_name.trim(),
            username: normalizedUsername,
            password
        };

        const result = await usersCollection.insertOne(newUser);

        return res.status(201).json({
            message: `User created successfully for ${newUser.username}.`,
            user: publicUser({
                _id: result.insertedId,
                ...newUser
            })
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "That username already exists."
            });
        }

        console.error("Signup error:", error);
        return res.status(500).json({
            message: "A database or server error occurred during signup."
        });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if ([username, password].some(isBlank)) {
        return res.status(400).json({
            message: "Please enter both username and password."
        });
    }

    const normalizedUsername = normalizeUsername(username);

    try {
        const user = await usersCollection.findOne({
            username: normalizedUsername
        });

        if (!user) {
            return res.status(404).json({
                message: "That username does not exist."
            });
        }

        if (user.password !== password) {
            return res.status(401).json({
                message: "Password is incorrect."
            });
        }

        return res.json({
            message: `Login successful. Welcome, ${user.f_name}!`,
            user: publicUser(user)
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "A database or server error occurred during login."
        });
    }
});

async function connectDatabase() {
    try {
        await client.connect();
        const db = client.db(databaseName);
        usersCollection = db.collection("users");
        await usersCollection.createIndex({ username: 1 }, { unique: true });
        console.log(`Connected to MongoDB database "${databaseName}"`);
    } catch (error) {
        console.error("Could not connect to MongoDB");
        console.error(error);
        throw error;
    }
}

async function startServer() {
    try {
        await connectDatabase();

        const server = app.listen(port, () => {
            console.log(`Server running on port ${port}`);
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
