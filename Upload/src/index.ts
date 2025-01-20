import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import simpleGit from "simple-git";
import generate from "./utils/generate";
import { getAllFiles } from "./file";
import path from "path";
import { uploadFile } from "./aws";
import { createClient } from "redis";
import { hash, compare } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import mongoose from "mongoose";
import { User } from "./models/User";
import fs from 'fs';
import AWS from 'aws-sdk';
import { Log } from './models/User';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string }
    }
  }
}

const publisher = createClient();
publisher.connect();

const client = createClient();
client.connect();

const s3 = new AWS.S3();

const app = express();

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    credentials: true,
    optionsSuccessStatus: 204
}));
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(204);
});


// Parse cookies first
app.use(cookieParser());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vercel-clone');

// Add middleware to check auth
const authenticateToken = async (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = verify(token, process.env.JWT_SECRET!);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post("/deploy", authenticateToken, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.deployments.length >= 5) {
            return res.status(400).json({ error: 'Maximum deployment limit reached' });
        }
        
        const repoUrl = req.body.repoUrl;
        const id = generate();
        
        await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));
        const files = getAllFiles(path.join(__dirname, `output/${id}`));
        
        for (const file of files) {
            await uploadFile(file.slice(__dirname.length + 1), file);
        }
        
        user.deployments.push(id);
        await user.save();
        
        await publisher.lPush("build-queue", id);
        await publisher.hSet("status", id, "uploaded");
        
        res.json({ id });
    } catch (error) {
        console.error("Deploy error:", error);
        res.status(500).json({ error: "Deployment failed" });
    }
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
        // Store log in MongoDB
        const logEntry = new Log({
            deploymentId: id,
            message,
            type
        });
        await logEntry.save();
        res.json({ success: true });
    } catch (error) {
        console.error("Error storing log:", error);
        res.status(500).json({ error: "Failed to store log" });
    }
});

app.get("/logs/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
        const logs = await Log.find({ deploymentId: id }).sort({ timestamp: 1 });
        res.json(logs);
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

// Auth routes
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await hash(password, 10);
    
    const user = new User({
      email,
      password: hashedPassword,
    });
    
    await user.save();
    res.status(200).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = sign({ userId: user._id }, process.env.JWT_SECRET!);
    res.cookie('token', token, { httpOnly: true });
    res.status(200).json({ 
      user: { 
        id: user._id, 
        email: user.email, 
        deployments: user.deployments 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out' });
    }
);

app.get("/auth/session", authenticateToken, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
            user: { 
                id: user._id, 
                email: user.email, 
                deployments: user.deployments 
            } 
        });
    } catch (error) {
        console.error('Session error:', error);
        res.status(500).json({ error: 'Failed to fetch session' });
    }
});

app.get('/deployments', authenticateToken, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get deployments with their status, logs, and other details
        const deploymentPromises = user.deployments.map(async (id) => {
            const status = await client.hGet("status", id) || 'unknown';
            const error = await client.hGet("error", id);
            const logs = await Log.find({ deploymentId: id }).sort({ timestamp: 1 });
            
            return {
                id,
                status,
                error: error || null,
                logs,
                url: status === 'deployed' ? `http://${id}.localhost:3001` : null
            };
        });

        const deployments = await Promise.all(deploymentPromises);
        res.json({ deployments });
    } catch (error) {
        console.error('Deployments error:', error);
        res.status(500).json({ error: 'Failed to fetch deployments' });
    }
});

app.delete('/deployments/:id', authenticateToken, async (req, res) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const deploymentId = req.params.id;
        
        // Check if deployment exists in user's deployments
        if (!user.deployments.includes(deploymentId)) {
            return res.status(404).json({ error: 'Deployment not found' });
        }

        // Remove deployment from user's deployments array
        user.deployments = user.deployments.filter(id => id !== deploymentId);
        await user.save();
        
        // Clean up Redis data
        await Promise.all([
            client.hDel("status", deploymentId),
            client.hDel("error", deploymentId),
            client.del(`logs:${deploymentId}`)
        ]);

        // Delete deployment files from S3
        try {
            const objects = await s3.listObjectsV2({
                Bucket: `${process.env.AWS_BUCKET_NAME}`,
                Prefix: `build/${deploymentId}`
            }).promise();

            if (objects.Contents && objects.Contents.length > 0) {
                await s3.deleteObjects({
                    Bucket: `${process.env.AWS_BUCKET_NAME}`,
                    Delete: {
                        Objects: objects.Contents.map(({ Key }) => ({ Key: Key! }))
                    }
                }).promise();
            }
        } catch (error) {
            console.error('Failed to cleanup S3:', error);
            // Don't fail the request if S3 cleanup fails
        }

        res.json({ message: 'Deployment deleted successfully' });
    } catch (error) {
        console.error('Delete deployment error:', error);
        res.status(500).json({ error: 'Failed to delete deployment' });
    }
});

app.post('/redeploy/:id', authenticateToken, async (req, res) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const deploymentId = req.params.id;
        
        // Check if deployment exists in user's deployments
        if (!user.deployments.includes(deploymentId)) {
            return res.status(404).json({ error: 'Deployment not found' });
        }

        // Remove deployment from user's deployments array
        user.deployments = user.deployments.filter(id => id !== deploymentId);
        await user.save();
        
        // Clean up Redis data
        await Promise.all([
            client.hDel("status", deploymentId),
            client.hDel("error", deploymentId),
            client.del(`logs:${deploymentId}`)
        ]);

        // Delete deployment files from S3
        try {
            const objects = await s3.listObjectsV2({
                Bucket: `${process.env.AWS_BUCKET_NAME}`,
                Prefix: `build/${deploymentId}`
            }).promise();

            if (objects.Contents && objects.Contents.length > 0) {
                await s3.deleteObjects({
                    Bucket: `${process.env.AWS_BUCKET_NAME}`,
                    Delete: {
                        Objects: objects.Contents.map(({ Key }) => ({ Key: Key! }))
                    }
                }).promise();
            }
        } catch (error) {
            console.error('Failed to cleanup S3:', error);
            // Don't fail the request if S3 cleanup fails
        }

        // Trigger a new deployment
        const repoUrl = req.body.repoUrl;
        const id = deploymentId; // Use the same ID for redeployment
        
        await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));
        const files = getAllFiles(path.join(__dirname, `output/${id}`));
        
        for (const file of files) {
            await uploadFile(file.slice(__dirname.length + 1), file);
        }
        
        user.deployments.push(id);
        await user.save();
        
        await publisher.lPush("build-queue", id);
        await publisher.hSet("status", id, "uploaded");
        
        res.json({ message: 'Redeployment triggered successfully', id });
    } catch (error) {
        console.error('Redeploy error:', error);
        res.status(500).json({ error: 'Failed to redeploy' });
    }
});

app.listen(3000);