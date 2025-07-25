"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validateFile_1 = require("../middleware/validateFile");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.post("/:companyId/:type/file-upload", validateFile_1.checkValidFileUpload, 
// multerUpload.single("file"),
upload_1.uploadFile1, validateFile_1.hashMiddleware, (req, res) => {
    res.json({ message: "File Uploaded Successfully" });
});
exports.default = router;
