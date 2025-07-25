import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const amazonS3Config: any = {
  accessKey: process.env.AWS_ACCESS_KEY || "",
  secretKey: process.env.AWS_SECRET_KEY || "",
  bucketName: process.env.AWS_BUCKET_NAME || "",
  bucketRegion: process.env.AWS_BUCKET_REGION || "",
  expiryTimeForSignedUrl: 3600,
};

/**
 * @constant {S3Client} s3
 * @description An instance of the AWS S3 (Simple Storage Service) client configured with credentials and region.
 */
const s3 = new S3Client({
  credentials: {
    accessKeyId: amazonS3Config.accessKey,
    secretAccessKey: amazonS3Config.secretKey,
  },
  region: amazonS3Config.bucketRegion,
});

/**
 * @constant {string} Bucket
 * @description The name of the S3 bucket used for storing objects.
 */
export const Bucket: string = amazonS3Config.bucketName;

export default s3;
