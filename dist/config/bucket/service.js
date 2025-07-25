"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanFilename = cleanFilename;
exports.getTotalSize = getTotalSize;
exports.uploadFile = uploadFile;
const client_s3_1 = require("@aws-sdk/client-s3");
const configuration_1 = require("./configuration");
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
function cleanFilename(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        const regex = /[^a-zA-Z0-9\-_.]/g;
        const cleanedFilename = filename.replace(regex, "");
        return cleanedFilename;
    });
}
/**
 * @method getTotalSize
 * @param {string} Key - The prefix of the files to list.
 * @returns {Promise<number>} - The total size of all objects with the given prefix.
 * @description Calculates and returns the total size of all objects in the bucket that match the given prefix.
 */
function getTotalSize(Key) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const newS3Client = new client_s3_1.S3Client({
                credentials: {
                    accessKeyId: amazonS3Config.accessKey,
                    secretAccessKey: amazonS3Config.secretKey,
                },
                region: amazonS3Config.bucketRegion,
            });
            const command = new client_s3_1.ListObjectsV2Command({
                Bucket: configuration_1.Bucket,
                Prefix: Key,
            });
            const data = yield newS3Client.send(command);
            newS3Client.destroy();
            const totalSize = ((data === null || data === void 0 ? void 0 : data.Contents) || []).reduce((acc, obj) => {
                return acc + obj.Size;
            }, 0) || 0;
            return totalSize;
        }
        catch (error) {
            throw new Error(error);
        }
    });
}
function uploadFile(Key, Body, mimetype) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const newS3Client = new client_s3_1.S3Client({
                credentials: {
                    accessKeyId: amazonS3Config.accessKey,
                    secretAccessKey: amazonS3Config.secretKey,
                },
                region: amazonS3Config.bucketRegion,
            });
            console.log("uploadFile Key----->", Key);
            console.log("uploadFile Body----->", Body);
            console.log("uploadFile mimetype----->", mimetype);
            console.log("newS3Client----->", newS3Client);
            const command = new client_s3_1.PutObjectCommand({
                Bucket: configuration_1.Bucket,
                Key,
                Body,
                ContentType: mimetype,
            });
            console.log("command----->", command);
            yield newS3Client.send(command);
            newS3Client.destroy();
            return Key;
        }
        catch (error) {
            console.log("uploadFile error-->", error);
            throw new Error(error);
        }
    });
}
