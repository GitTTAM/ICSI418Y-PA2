const express = require("express");
const cors = require("cors");
const { connectToMongoDB, disconnectFromMongoDB } = require("./db");

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.json({
        message: "Server is running"
    });
});

async function startServer() {
    try {
        await connectToMongoDB();

        const server = app.listen(9000, () => {
            console.log("Server running on port 9000");
        });

        const shutdown = () => {
            server.close(async () => {
                try {
                    await disconnectFromMongoDB();
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