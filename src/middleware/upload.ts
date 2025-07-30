import { NextFunction, Request, Response } from "express";
import { cleanFilename, uploadFile } from "../config/bucket/service";
import * as path from "path";
import { generateUUID } from "./../common/common-function";
import axios from "axios";

export const uploadFileS3 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    console.log("Final req.file----->", req.file);
    console.log("Final req.params----->", req.params);

    const { companyId, type } = req.params;
    const { cabinetId } = req.query;
    console.log("companyId----->", companyId);
    console.log("type----->", type);
    console.log("cabinetId----->", cabinetId);

    const originalName = req.file.originalname;
    const ext = path.extname(originalName); // includes leading dot, e.g. ".pdf"

    console.log("ext----->", ext);
    // build unique S3 key
    const timestamp = Date.now();
    const folder = `${type}`; // e.g. "evidence"
    const filename = `${timestamp}-${generateUUID()}`;
    const fullKey = `${folder}/${filename}`;

    // upload buffer
    const s3Key = await uploadFile(fullKey, req.file.buffer, req.file.mimetype);

    console.log("s3Key----->", s3Key);

    try {
      // Send the S3 key to another server
      await axios.post("http://localhost:3000/web-hook/set-s3-filepath", {
        location: s3Key, // 👈 sending location in body
        companyId,
        type,
        cabinetId,
      });
    } catch (error: any) {
      console.log("error in axios post----->", error);
    }

    // respond or attach to req for further handling
    res.json({ location: s3Key });

    next();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
