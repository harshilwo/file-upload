import { NextFunction, Request, Response } from "express";
import { cleanFilename, uploadFile } from "../config/bucket/service";
import * as path from "path";

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
    console.log("companyId----->", companyId);
    console.log("type----->", type);

    const originalName = req.file.originalname;
    const ext = path.extname(originalName); // includes leading dot, e.g. ".pdf"
    const baseName = path.parse(originalName).name; // filename without extension

    const cleanedBase = await cleanFilename(baseName);

    // build unique S3 key
    const timestamp = Date.now();
    const folder = `${companyId}/${type}`; // e.g. "COMPANYID/evidence"
    const filename = `${timestamp}-${cleanedBase}${ext}`;
    const fullKey = `${folder}/${filename}`;

    // upload buffer
    const s3Key = await uploadFile(fullKey, req.file.buffer, req.file.mimetype);

    console.log("s3Key----->", s3Key);

    // respond or attach to req for further handling
    res.json({ location: s3Key });

    next();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
