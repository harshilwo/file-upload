import { Request, Response, NextFunction } from "express";
import path from "path";
import { fileTypeFromBuffer } from "file-type";

// Upload rules for all types
const uploadRules: Record<
  string,
  { types: string[]; extensions?: string[]; maxSize: number; message: string }
> = {
  profile: {
    types: ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"],
    extensions: ["jpeg", "png", "jpg", "gif", "webp"],
    maxSize: 2 * 1024 * 1024, // 2MB
    message: "Only JPEG, PNG, JPG, GIF, and WEBP files are allowed",
  },
  policy: {
    types: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    message: "Upload failed: Only PDF, DOC, and DOCX files are allowed",
  },
  artifact: {
    types: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    maxSize: 50 * 1024 * 1024,
    message:
      "Upload failed: Only PDF, DOC, DOCX, XLS, and XLSX files are allowed",
  },
  questionnaire: {
    types: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    maxSize: 50 * 1024 * 1024,
    message: "Upload failed: Only XLS and XLSX files are allowed",
  },
  evidence: {
    types: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    maxSize: 50 * 1024 * 1024,
    message:
      "Only PDF, JPEG, JPG, PNG, DOC, DOCX, XLS, and XLSX files are allowed",
  },
};

// Utility to validate PDF structure
const isValidPDF = (buffer: Buffer): boolean => {
  const header = buffer.toString("utf8", 0, 5);
  const footer = buffer.toString("utf8", buffer.length - 10);
  return header === "%PDF-" && footer.includes("%%EOF");
};

export const checkFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!req.file) return next();

    console.log("req.file=================----->", req.file);
    console.log("req.body=================----->", req.body);

    const { type } = req.body;

    // Ensure type exists in uploadRules
    const rule = uploadRules[type];
    console.log("rule=================----->", rule);
    if (!rule) {
      return res.status(400).json({ error: "Invalid file upload type." });
    }

    const { types, extensions, maxSize, message } = rule;

    console.log("types=================----->", types);
    console.log("extensions=================----->", extensions);
    console.log("maxSize=================----->", maxSize);
    console.log("message=================----->", message);

    // Check MIME type
    if (!types.includes(req.file.mimetype)) {
      return res.status(400).json({ error: message });
    }

    const detection = await fileTypeFromBuffer(req.file.buffer);
    console.log("detection=================----->", detection);
    if (!detection || detection.mime !== req.file.mimetype) {
      return res
        .status(400)
        .json({ error: "File content does not match declared type." });
    }

    // Check extension if required
    if (extensions) {
      const fileExtension = path
        .extname(req.file.originalname)
        .toLowerCase()
        .slice(1);
      if (!extensions.includes(fileExtension)) {
        return res.status(400).json({
          error: `File type not supported. Must be one of: ${extensions.join(
            ", "
          )}`,
        });
      }
    }

    // Check file size
    if (req.file.size > maxSize) {
      return res.status(400).json({
        error: `File size exceeds the limit of ${maxSize / (1024 * 1024)} MB.`,
      });
    }

    const buf = req.file.buffer;

    if (detection.mime === "application/pdf") {
      if (!isValidPDF(buf))
        return res
          .status(400)
          .json({ error: "Uploaded PDF is corrupted or invalid." });
    }

    if (detection.mime === "image/jpeg") {
      if (
        !(
          buf[0] === 0xff &&
          buf[1] === 0xd8 &&
          buf[buf.length - 2] === 0xff &&
          buf[buf.length - 1] === 0xd9
        )
      ) {
        return res.status(400).json({ error: "Corrupt JPEG image." });
      }
    }

    next();
  } catch (error: any) {
    console.error("File validation error:", error);
    return res.status(500).json({ error: error.message });
  }
};
