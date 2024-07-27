import { S3 } from "aws-sdk";
import fs from "fs";
import dotenv from "dotenv";
import { String } from "aws-sdk/clients/acm";

dotenv.config();

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    signatureVersion: 'v4'

});

export const uploadFile = async (fileName: string, localFilePath: string) => {
    try {
        const fileContent = fs.readFileSync(localFilePath);
        const response = await s3.upload({
            Body: fileContent,
            Bucket: `${process.env.AWS_BUCKET_NAME}`,
            Key: fileName,
        }).promise();
        console.log(response);
    } catch (error) {
        console.error("Error uploading file:", error);
    }
};
