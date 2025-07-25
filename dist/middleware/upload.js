"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile1 = exports.isValidateFileData = void 0;
const multer_store_1 = __importDefault(require("./multer-store"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const word_extractor_1 = __importDefault(require("word-extractor"));
const XLSX = __importStar(require("xlsx"));
const ExcelJS = __importStar(require("exceljs"));
const common_function_1 = require("../common/common-function");
// const handleUpload2 = async ({
//   company,
//   file,
//   baseUrl,
//   body,
//   isExcelFile = false,
// }: {
//   company: Schema.Types.ObjectId | string;
//   file: any;
//   baseUrl: any;
//   body: any;
//   isExcelFile?: boolean;
// }) => {
//   const companyDetails: ICompanyModel | any = await CompanyModel.findOne({
//     company,
//     recordDeleted: false,
//   });
//   if (!companyDetails) {
//     throw new Error("Company not found");
//   }
//   const bucketSize = await S3BucketService.getTotalSize(`${company}/`);
//   if (
//     companyDetails.plan.storageLimitInGb * 1024 * 1024 * 1024 <=
//     bucketSize + file.size
//   ) {
//     throw new Error(
//       `Your usage has hit the ${companyDetails.plan.storageLimitInGb} GB Free plan limit.
//       Contact ${Config.supportEmail} for assistance.`
//     );
//   }
//   let name: string | any;
//   let folderName: string;
//   const fileExtension = isExcelFile
//     ? "xlsx"
//     : file.originalname.match(/\.([^.]+)$/)[1];
//   const validBaseUrls = [
//     "/quiz-hub",
//     "/cabinet",
//     // '/questionnaire',
//     "/evidence",
//     "/artifacts",
//     "/recommended-standard",
//   ];
//   if (baseUrl === "/questionnaire") {
//     name = await S3BucketService.cleanFilename(body.data.name);
//     folderName = `${company}${baseUrl}/${name}-${new Date().toLocaleDateString(
//       "en-CA",
//       {
//         year: "numeric",
//         month: "2-digit",
//         day: "2-digit",
//         timeZone: companyDetails.timeZone,
//       }
//     )}_${new Date()
//       .toLocaleTimeString("en-GB", {
//         hour: "2-digit",
//         minute: "2-digit",
//         timeZone: companyDetails.timeZone,
//       })
//       .replace(/:/g, "")}.${fileExtension}`;
//   } else if (validBaseUrls.includes(baseUrl)) {
//     name = await getUniqueFileName({
//       name: body.data.name,
//       parentId: body.data.parentId || null,
//       company: String(body.data.company),
//       isFolder: body.isFolder || false,
//       isEvidence: baseUrl === "/evidence",
//       isArtifacts: baseUrl === "/artifacts",
//       isRecommendedStandard: baseUrl === "/recommended-standard",
//     });
//     // name = await S3BucketService.cleanFilename(body.data.name);
//     folderName = `${company}${baseUrl}/${new Date().valueOf()}-${name}.${fileExtension}`;
//   }
//   const fileLocation = await S3BucketService.uploadFile(
//     folderName,
//     file.buffer,
//     file.mimetype
//   );
//   return fileLocation;
// };
const isValidPDF = (buffer) => {
    try {
        // Check header (first 8 bytes)
        if (!buffer.toString("ascii", 0, 8).match(/%PDF-1\.[0-9]/)) {
            return false;
        }
        // Quick check for EOF marker in last 1KB
        return buffer.slice(-1024).includes("%EOF");
    }
    catch (_a) {
        return false;
    }
};
const isPasswordProtected = (buffer) => {
    try {
        const header = buffer.slice(0, 8).toString("hex").toUpperCase();
        // For .doc files (Old format)
        if (header === "D0CF11E0A1B11AE1") {
            const encryptionMarkers = [
                Buffer.from([
                    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0xe0,
                ]), // Old DOC encryption
                Buffer.from("Microsoft.Container.EncryptionTransform", "utf16le"),
            ];
            return encryptionMarkers.some((marker) => buffer.includes(marker));
        }
        // For .docx files (New format)
        if (buffer.toString("ascii", 0, 2) === "PK") {
            const docxEncryptionMarkers = [
                Buffer.from("EncryptedPackage", "utf8"),
                Buffer.from("encryption", "utf8"),
            ];
            return docxEncryptionMarkers.some((marker) => buffer.includes(marker));
        }
        // For PDF files (Check for /Encrypt dictionary)
        if (buffer.toString("ascii", 0, 5) === "%PDF-") {
            return buffer.includes(Buffer.from("/Encrypt", "utf8"));
        }
        return false;
    }
    catch (error) {
        console.error("Error checking password protection:", error);
        return false;
    }
};
const isValidDocFormat = (buffer) => {
    try {
        if (!(buffer === null || buffer === void 0 ? void 0 : buffer.length) || buffer.length < 8) {
            return false;
        }
        // Check DOC format (D0 CF 11 E0 A1 B1 1A E1)
        const docSignature = buffer.slice(0, 8).toString("hex");
        if (docSignature === "d0cf11e0a1b11ae1") {
            return true;
        }
        // Check DOCX format (starts with PK)
        const docxSignature = buffer.toString("ascii", 0, 2);
        if (docxSignature === "PK") {
            // Additional check for DOCX format
            const zipHeader = buffer.slice(0, 4).toString("hex");
            return zipHeader === "504b0304";
        }
        return false;
    }
    catch (_a) {
        return false;
    }
};
const getTextFromPDF = (buffer) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!isValidPDF(buffer)) {
            throw new Error("Invalid or corrupted PDF file");
        }
        if (isPasswordProtected(buffer)) {
            throw new Error("This file is password-protected and cannot be opened.");
        }
        const renderPage = (pageData) => __awaiter(void 0, void 0, void 0, function* () {
            // check documents https://mozilla.github.io/pdf.js/
            let renderOptions = {
                // replaces all occurrences of whitespace with standard spaces (0x20). The default value is `false`.
                normalizeWhitespace: false,
                // do not attempt to combine same line TextItem's. The default value is `false`.
                disableCombineTextItems: false,
            };
            const textContent = yield pageData.getTextContent(renderOptions);
            if (!textContent.items.map((item) => { var _a; return (_a = item.str) === null || _a === void 0 ? void 0 : _a.trim(); }).join("")) {
                throw new Error("Blank PDF page detected");
            }
            let text = "";
            let x = 0;
            let y = 0;
            // for (let item of textContent.items) {
            //   if (x + 0.1 >= item.transform[4] && item.transform[5] === y) {
            //     text += item.str;
            //   } else {
            //     text += ` ${item.str}`;
            //   }
            //   x = item.transform[4] + item.width;
            //   y = item.transform[5];
            // }
            textContent.items.forEach((item) => {
                if (x + 0.1 >= item.transform[4] && item.transform[5] === y) {
                    text += item.str;
                }
                else {
                    text += ` ${item.str}`;
                }
                x = item.transform[4] + item.width;
                // eslint-disable-next-line prefer-destructuring
                y = item.transform[5];
            });
            return text;
        });
        let options = {
            pagerender: renderPage,
        };
        const data = yield (0, pdf_parse_1.default)(buffer, options);
        return data.text;
    }
    catch (error) {
        console.error("Error reading PDF:", error);
        if (error.message.includes("Failed to parse PDF")) {
            throw new Error("Corrupted PDF file detected");
        }
        throw error;
    }
});
const getTextFromDoc = (buffer) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isValidDocFormat(buffer)) {
        throw new Error("Corrupted or invalid Word document format");
    }
    if (isPasswordProtected(buffer)) {
        throw new Error("This file is password-protected and cannot be opened.");
    }
    const extractor = new word_extractor_1.default();
    const extracted = yield extractor.extract(buffer);
    const text = extracted.getBody();
    if (!text || !/\S/.test(text)) {
        // throw new ErrorHandler('Blank document detected');
    }
    return text;
});
const isValidateFileData = (file) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        if (!((_a = file === null || file === void 0 ? void 0 : file.originalname) === null || _a === void 0 ? void 0 : _a.includes(".xlsx")) &&
            !((_b = file === null || file === void 0 ? void 0 : file.originalname) === null || _b === void 0 ? void 0 : _b.includes(".xls"))) {
            throw new Error("Only .xlsx or .xls file supported.");
        }
        if ((_c = file === null || file === void 0 ? void 0 : file.originalname) === null || _c === void 0 ? void 0 : _c.endsWith(".xls")) {
            try {
                XLSX.read(file.buffer, { type: "buffer" });
                const isXlsFile = (buffer) => {
                    // XLS signature: D0 CF 11 E0 A1 B1 1A E1 (first 8 bytes)
                    return buffer.slice(0, 8).toString("hex") === "d0cf11e0a1b11ae1";
                };
                if (!isXlsFile(file.buffer)) {
                    throw new Error("The file appears to be corrupted or does not contain a valid worksheet.");
                }
            }
            catch (error) {
                throw new Error("Unable to read the .xls file. It may be corrupted or invalid.");
            }
        }
        else {
            const workbook = new ExcelJS.Workbook();
            // Try loading the file — will throw if corrupted or invalid format
            try {
                yield workbook.xlsx.load(file.buffer);
            }
            catch (error) {
                throw new Error("Unable to process the Excel file. It may be corrupted or improperly formatted.");
            }
            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                throw new Error("The file is not valid or has no worksheets. Please upload a valid Excel file with questions.");
            }
        }
        // const rows = await readXlsxFile(file.buffer);
        // Check if the file is empty or missing headers
        // if (rows.length === 0) {
        //   throw new ErrorHandler({
        //     code: 400,
        //     message: 'The file is empty or does not contain the required headers.',
        //   });
        // }
        // // Check if there are no records after the header row
        // if (rows.length === 1) {
        //   throw new ErrorHandler({
        //     code: 400,
        //     message:
        //       'The uploaded file does not contain any questions. Please upload a valid file with questions.',
        //   });
        // }
        // if (rows[0][0] !== 'Question') {
        //   throw new ErrorHandler({
        //     code: 400,
        //     message: 'Error: Unsupported file format. Please upload a valid file.',
        //   });
        // }
        return true;
    }
    catch (error) {
        throw new Error(error.message || "Error while processing file.");
    }
});
exports.isValidateFileData = isValidateFileData;
const uploadFile1 = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    multer_store_1.default.single("file")(req, res, () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (req.body.data) {
                req.body.data =
                    typeof req.body.data === "string"
                        ? JSON.parse(req.body.data)
                        : req.body.data;
            }
            //   else if (req.user) {
            //     req.body.data = {};
            //   }
            if (req.file) {
                // Define allowed file types by endpoint
                const allowedFileTypesByEndpoint = {
                    "/cabinet": {
                        types: [
                            "application/pdf", // PDF
                            "application/msword", // DOC
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
                        ],
                        message: "Upload failed: Only PDF, DOC, and DOCX files are allowed",
                    },
                    "/artifacts": {
                        types: [
                            "application/pdf", // PDF
                            "application/msword", // DOC
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
                            "application/vnd.ms-excel", // XLS
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
                        ],
                        message: "Upload failed: Only PDF, DOC, DOCX, XLS, and XLSX files are allowed",
                    },
                    "/questionnaire": {
                        types: [
                            "application/vnd.ms-excel", // XLS
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
                        ],
                        message: "Upload failed: Only XLS and XLSX files are allowed",
                    },
                    "/recommended-standard": {
                        types: [
                            "application/pdf", // PDF
                            "application/msword", // DOC
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
                        ],
                        message: "Upload failed: Only PDF, DOC, and DOCX files are allowed",
                    },
                };
                const endpointRestrictions = allowedFileTypesByEndpoint[req.baseUrl];
                if (endpointRestrictions &&
                    !endpointRestrictions.types.includes(req.file.mimetype)) {
                    throw new Error(endpointRestrictions.message);
                }
                if (req.file.mimetype === "application/pdf") {
                    try {
                        const pdfText = yield getTextFromPDF(req.file.buffer);
                        // const pdfText = await extractTextFromBuffer(req.file.buffer);
                        if (!pdfText || !/\S/.test(pdfText)) {
                            // throw new ErrorHandler('Blank PDF files are not allowed');
                        }
                    }
                    catch (error) {
                        // if (error.message.toLowerCase().includes('password')) {
                        //   throw new ErrorHandler(
                        //     'Upload failed: Password-protected files are not supported.',
                        //   );
                        // }
                        if (error.message.includes("Blank PDF")) {
                            throw new Error("Upload failed: The file is not in a supported format or is corrupted. Please try again with a valid file.");
                        }
                        if (error.message.includes("corrupted") ||
                            error.message.includes("Invalid")) {
                            throw new Error("Upload failed: The file is not in a supported format or is corrupted. Please try again with a valid file.");
                        }
                    }
                }
                else if (req.file.mimetype ===
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                    req.file.mimetype === "application/msword") {
                    try {
                        const docText = yield getTextFromDoc(req.file.buffer);
                        if (!docText || !/\S/.test(docText)) {
                            // throw new ErrorHandler('Blank document detected');
                        }
                    }
                    catch (error) {
                        if (error.message.toLowerCase().includes("password") ||
                            error.message.toLowerCase().includes("encrypted") ||
                            error.message.toLowerCase().includes("protection")) {
                            throw new Error("Upload failed: Password-protected files are not supported.");
                        }
                        // if (error.message.toLowerCase().includes('blank')) {
                        //   throw new ErrorHandler(
                        //     'The file is not in a supported format or is corrupted. Please try again with a valid file.',
                        //   );
                        // }
                        if (error.message.toLowerCase().includes("corrupt") ||
                            error.message.toLowerCase().includes("invalid")) {
                            throw new Error("Upload failed: The file is not in a supported format or is corrupted. Please try again with a valid file.");
                        }
                    }
                }
                else if (req.file.mimetype === "application/json" ||
                    req.file.originalname.toLowerCase().endsWith(".json")) {
                    throw new Error("Upload failed: JSON files are not allowed");
                }
                const validBaseUrls = ["/quiz-hub", "/cabinet", "/questionnaire"];
                if (req.file.mimetype.includes("image")) {
                    if (validBaseUrls.includes(req.baseUrl)) {
                        throw new Error("Invalid format");
                    }
                    if (req.baseUrl === "/evidence" ||
                        req.baseUrl === "/artifacts" ||
                        req.baseUrl === "/recommended-standard") {
                        const imageTypesAllowed = ["image/jpeg", "image/png", "image/jpg"];
                        if (!imageTypesAllowed.includes(req.file.mimetype)) {
                            throw new Error("Invalid format");
                        }
                    }
                }
                if (!req.file.mimetype.includes("image") &&
                    req.file.size > 50 * 1024 * 1024) {
                    throw new Error("File size must not exceed 50 MB");
                }
                if (req.baseUrl === "/cabinet" &&
                    (req.method === "PUT" || req.method === "PATCH")) {
                    // find the policy
                    //   const isCabinetExist = await CabinetModel.findOne({
                    //     company: req.user.company._id,
                    //     recordDeleted: false,
                    //   })
                    //     .sort({ createdBy: -1 })
                    //     .limit(1);
                    //   if (!isCabinetExist) {
                    //     throw new Error("Quiz not found.");
                    //   }
                }
                if (req.baseUrl === "/questionnaire" &&
                    (req.method === "PUT" || req.method === "PATCH")) {
                    // find the policy
                    //   const isQuestionnaireExist = await QuestionnaireModel.findOne({
                    //     company: req.user.company._id,
                    //     recordDeleted: false,
                    //   })
                    //     .sort({ createdBy: -1 })
                    //     .limit(1);
                    //   if (!isQuestionnaireExist) {
                    //     throw new Error("Questionnaire not found.");
                    //   }
                }
                if (req.baseUrl === "/questionnaire" && req.method === "POST") {
                    yield (0, exports.isValidateFileData)(req.file);
                }
                if (req.baseUrl === "/artifacts" &&
                    req.file &&
                    Array.isArray(req.body.data.sheetMappings)) {
                    const allowedSheets = req.body.data.sheetMappings.map((m) => m.sheetName);
                    const mime = req.file.mimetype;
                    if (mime ===
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                        // .xlsx using ExcelJS
                        const workbook = new ExcelJS.Workbook();
                        try {
                            yield workbook.xlsx.load(req.file.buffer);
                        }
                        catch (error) {
                            throw new Error("Unable to process the Excel file. It may be corrupted or improperly formatted.");
                        }
                        // Remove sheets not in sheetMappings
                        workbook.worksheets
                            .filter((ws) => !allowedSheets.includes(ws.name))
                            .forEach((ws) => workbook.removeWorksheet(ws.id));
                        const newBuffer = yield workbook.xlsx.writeBuffer();
                        req.file.buffer = newBuffer;
                        req.file.size = newBuffer.byteLength;
                    }
                    else if (mime === "application/vnd.ms-excel") {
                        // .xls using SheetJS
                        const wb = XLSX.read(req.file.buffer, { type: "buffer" });
                        const isXlsFile = (buffer) => {
                            // XLS signature: D0 CF 11 E0 A1 B1 1A E1 (first 8 bytes)
                            return buffer.slice(0, 8).toString("hex") === "d0cf11e0a1b11ae1";
                        };
                        if (!isXlsFile(req.file.buffer)) {
                            throw new Error("The file appears to be corrupted or does not contain a valid worksheet.");
                        }
                        // Filter only allowed sheets
                        const filteredSheets = {};
                        // eslint-disable-next-line no-restricted-syntax
                        for (const sheetName of allowedSheets) {
                            if (wb.Sheets[sheetName]) {
                                filteredSheets[sheetName] = wb.Sheets[sheetName];
                            }
                        }
                        const newWorkbook = {
                            SheetNames: allowedSheets.filter((n) => wb.Sheets[n]),
                            Sheets: filteredSheets,
                        };
                        // Write to xlsx format
                        const newBuffer = XLSX.write(newWorkbook, {
                            type: "buffer",
                            bookType: "xlsx",
                        });
                        req.file.buffer = newBuffer;
                        req.file.size = newBuffer.byteLength;
                        // Optional: change filename/mimetype if needed
                        req.file.originalname = req.file.originalname.replace(/\.xls$/, ".xlsx");
                        req.file.mimetype =
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    }
                }
                const resLocation = yield (0, common_function_1.handleUpload2)({
                    company: req.params.company,
                    file: req.file,
                    baseUrl: req.baseUrl,
                    body: req.body,
                });
                req.body.data.fileId = resLocation;
                req.body.data.fileSize = req.file.size;
            }
            next();
        }
        catch (error) {
            next(error);
        }
    }));
});
exports.uploadFile1 = uploadFile1;
