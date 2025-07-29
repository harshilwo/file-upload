import { Router, Request, Response } from "express";
import {
  checkUploadTimeStamp,
  hashMiddleware,
} from "../middleware/validateFile";
import multerUpload from "../middleware/multer-store";
import { checkFile } from "../middleware/checkFile";
import { uploadFileS3 } from "../middleware/upload";

const router = Router();

router.post(
  "/:companyId/:type/file-upload",
  checkUploadTimeStamp,
  multerUpload.single("file"),
  hashMiddleware,
  checkFile,
  uploadFileS3,
  (req: Request, res: Response) => {
    res.json({ message: "File Uploaded Successfully" });
  }
);

export default router;
