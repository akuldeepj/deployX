// import express from "express";
// import { S3 } from "aws-sdk";
// import dotenv from "dotenv";


// dotenv.config();

// console.log(process.env.AWS_ACCESS_KEY_ID)

// const s3 = new S3({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: process.env.AWS_REGION,
//     signatureVersion: 'v4'
// });

// const app = express();

// app.get("/*", async (req, res) => {
//     const host = req.hostname;

//     const id = host.split(".")[0];
//     const filePath = req.path;

//     console.log(id, filePath);

//     try{
//     const contents = await s3.getObject({
//         Bucket: `${process.env.AWS_BUCKET_NAME}`,
//         Key: `build/${id}${filePath}`
//     }).promise();
    
//     const type = filePath.endsWith("html") ? "text/html" : filePath.endsWith("css") ? "text/css" : "application/javascript"
//     res.set("Content-Type", type);

//     res.send(contents.Body);
// } catch(e) {
//     console.log(e);
//     res.status(404).send("Not found");
// }

// })

// app.listen(3001);

import express from "express";
import { S3 } from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

console.log("AWS Access Key ID:", process.env.AWS_ACCESS_KEY_ID);

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    signatureVersion: 'v4'
});

const app = express();

app.get("/*", async (req, res) => {
    const host = req.hostname;
    const id = host.split(".")[0];
    let filePath = req.path === "/" ? "/index.html" : req.path; // Serve index.html for root path
    const key = `build/${id}${filePath}`;

    console.log("ID:", id);
    console.log("File Path:", filePath);
    console.log("Constructed Key:", key);

    try {
        const contents = await s3.getObject({
            Bucket: `${process.env.AWS_BUCKET_NAME}`,
            Key: key
        }).promise();

        const extension = filePath.split(".").pop();
        const mimeTypes: { [key: string]: string } = {
            html: "text/html",
            css: "text/css",
            js: "application/javascript",
            json: "application/json",
            png: "image/png",
            jpg: "image/jpeg",
            svg: "image/svg+xml"
        };        

        const type = extension ? mimeTypes[extension] || "application/octet-stream" : "application/octet-stream";
        res.set("Content-Type", type);
        res.send(contents.Body);
    } catch (e: any) {
        console.error("Error fetching key:", (e as Error).message);
        res.status(404).send("Not Found");
    }
});

app.listen(3001, () => {
    console.log("Server started on port 3001");
});
