import express from "express";
import { S3 } from "aws-sdk";
import dotenv from "dotenv";


dotenv.config();

console.log(process.env.AWS_ACCESS_KEY_ID)

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
    const filePath = req.path;

    console.log(id, filePath);

    try{
    const contents = await s3.getObject({
        Bucket: `${process.env.AWS_BUCKET_NAME}`,
        Key: `build/${id}${filePath}`
    }).promise();
    
    const type = filePath.endsWith("html") ? "text/html" : filePath.endsWith("css") ? "text/css" : "application/javascript"
    res.set("Content-Type", type);

    res.send(contents.Body);
} catch(e) {
    console.log(e);
    res.status(404).send("Not found");
}

})

app.listen(3001);