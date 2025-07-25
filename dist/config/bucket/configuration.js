"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bucket = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const amazonS3Config = {
    accessKey: process.env.AWS_ACCESS_KEY || '',
    secretKey: process.env.AWS_SECRET_KEY || '',
    bucketName: process.env.AWS_BUCKET_NAME || '',
    bucketRegion: process.env.AWS_BUCKET_REGION || '',
    expiryTimeForSignedUrl: 3600,
};
/**
 * @constant {S3Client} s3
 * @description An instance of the AWS S3 (Simple Storage Service) client configured with credentials and region.
 */
const s3 = new client_s3_1.S3Client({
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
exports.Bucket = amazonS3Config.bucketName;
exports.default = s3;
