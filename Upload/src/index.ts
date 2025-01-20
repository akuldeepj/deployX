import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import generate from "./utils/generate";
import { getAllFiles } from "./file";
import path from "path";
import { uploadFile } from "./aws";
import { createClient } from "redis";
const publisher = createClient();
publisher.connect();

const client = createClient();
client.connect();

const app = express();
app.use(cors())
app.use(express.json());

app.post("/deploy", async (req, res) => {
    const repoUrl = req.body.repoUrl;
    const id = generate(); 
    await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));

    const files = getAllFiles(path.join(__dirname, `output/${id}`));

    files.forEach(async file => {
        await uploadFile(file.slice(__dirname.length + 1), file);
    })

    await new Promise((resolve) => setTimeout(resolve, 5000))
    publisher.lPush("build-queue", id);
    
    publisher.hSet("status", id, "uploaded");

    res.json({id})
    
});

app.get("/status", async (req, res) => {
    const id = req.query.id;
    const response = await client.hGet("status", id as string);
    res.json({
        status: response
    })
})

app.post("/logs", async (req, res) => {
    const { id, message, type } = req.body;
    
    try {
        // Store log in Redis with timestamp
        const logEntry = {
            message,
            type, // 'info', 'error', etc.
            timestamp: new Date().toISOString()
        };
        
        await client.lPush(`logs:${id}`, JSON.stringify(logEntry));
        res.json({ success: true });
    } catch (error) {
        console.error("Error storing log:", error);
        res.status(500).json({ error: "Failed to store log" });
    }
});

app.get("/logs/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
        const logs = await client.lRange(`logs:${id}`, 0, -1);
        const parsedLogs = logs.map(log => JSON.parse(log));
        res.json(parsedLogs);
    } catch (error) {
        console.error("Error retrieving logs:", error);
        res.status(500).json({ error: "Failed to retrieve logs" });
    }
});

app.get("/error/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const error = await client.hGet("error", id);
        res.json({ error: error || null });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch error details" });
    }
});

app.listen(3000);