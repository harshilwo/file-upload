import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { Bucket } from "./configuration";
import dotenv from "dotenv";
dotenv.config();

const amazonS3Config = {
  accessKey: process.env.AWS_ACCESS_KEY || "",
  secretKey: process.env.AWS_SECRET_KEY || "",
  bucketName: process.env.AWS_BUCKET_NAME || "",
  bucketRegion: process.env.AWS_BUCKET_REGION || "",
  expiryTimeForSignedUrl: 3600,
};

/**
 * @method cleanFilename
 * @param {string} filename - The file name to be cleaned.
 * @returns {Promise<string>} - The cleaned file name.
 * @description Removes any characters that are not alphanumeric, dashes, dots, or underscores from the file name.
 */
export async function cleanFilename(filename: string): Promise<string> {
  const regex = /[^a-zA-Z0-9\-_.]/g;
  const cleanedFilename = filename.replace(regex, "-");

  return cleanedFilename;
}

/**
 * @method getTotalSize
 * @param {string} Key - The prefix of the files to list.
 * @returns {Promise<number>} - The total size of all objects with the given prefix.
 * @description Calculates and returns the total size of all objects in the bucket that match the given prefix.
 */
export async function getTotalSize(Key: string): Promise<Number> {
  try {
    const newS3Client = new S3Client({
      credentials: {
        accessKeyId: amazonS3Config.accessKey,
        secretAccessKey: amazonS3Config.secretKey,
      },
      region: amazonS3Config.bucketRegion,
    });

    const command = new ListObjectsV2Command({
      Bucket,
      Prefix: Key,
    });

    const data = await newS3Client.send(command);
    newS3Client.destroy();

    const totalSize: Number =
      (data?.Contents || []).reduce((acc: any, obj: any) => {
        return acc + obj.Size;
      }, 0) || 0;

    return totalSize;
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function uploadFile(
  Key: string,
  Body: Buffer,
  ContentType: string
): Promise<string> {
  try {
    const client = new S3Client({
      credentials: {
        accessKeyId: amazonS3Config.accessKey,
        secretAccessKey: amazonS3Config.secretKey,
      },
      region: amazonS3Config.bucketRegion,
    });

    const cmd = new PutObjectCommand({
      Bucket: Bucket,
      Key,
      Body,
      ContentType,
    });
    await client.send(cmd);
    client.destroy();

    return Key;
  } catch (error: any) {
    console.log("uploadFile error-->", error);
    throw new Error(error);
  }
}
