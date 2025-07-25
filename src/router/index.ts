import { Router, Request, Response } from "express";
import {
  checkValidFileUpload,
  hashMiddleware,
} from "../middleware/validateFile";
import multerUpload from "../middleware/multer-store";
import { uploadFile1 } from "../middleware/upload";

const router = Router();

router.post(
  "/:companyId/:type/file-upload",
  checkValidFileUpload,
  // multerUpload.single("file"),
  uploadFile1,
  hashMiddleware,
  (req: Request, res: Response) => {
    res.json({ message: "File Uploaded Successfully" });
  }
);

export default router;
