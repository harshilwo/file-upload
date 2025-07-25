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
exports.handleUpload2 = exports.getUniqueFileName = void 0;
const mongoose_1 = require("mongoose");
const service_1 = require("../config/bucket/service");
const getUniqueFileName = (_a) => __awaiter(void 0, [_a], void 0, function* ({ name, parentId, company, isFolder, isEvidence = false, isArtifacts = false, isRecommendedStandard = false, }) {
    const baseName = name === null || name === void 0 ? void 0 : name.replace(/\(\d+\)(?=\.[^.]*$|$)/, "").trim();
    const extension = (name === null || name === void 0 ? void 0 : name.includes("."))
        ? name === null || name === void 0 ? void 0 : name.substring(name === null || name === void 0 ? void 0 : name.lastIndexOf("."))
        : "";
    const nameWithoutExt = (name === null || name === void 0 ? void 0 : name.includes("."))
        ? baseName.substring(0, baseName.lastIndexOf("."))
        : baseName;
    let counter = 0;
    let newName = name;
    let fileExists = true;
    while (fileExists) {
        const query = {
            name: newName,
            company: new mongoose_1.Types.ObjectId(company),
            recordDeleted: false,
            isFolder,
        };
        if (parentId) {
            query.parentId = new mongoose_1.Types.ObjectId(parentId);
        }
        else {
            query.parentId = null;
        }
        let count = 0;
        // if (isEvidence) {
        //   count = await EvidenceModel.countDocuments(query);
        // } else if (isArtifacts) {
        //   count = await ArtifactsModel.countDocuments(query);
        // } else if (isRecommendedStandard) {
        //   count = await RecommendedStandardModel.countDocuments(query);
        // } else {
        //   count = await CabinetModel.countDocuments(query);
        // }
        if (count === 0) {
            fileExists = false;
        }
        else {
            counter += 1;
            newName = `${nameWithoutExt}(${counter})${extension}`;
        }
    }
    return newName;
});
exports.getUniqueFileName = getUniqueFileName;
const handleUpload2 = (_a) => __awaiter(void 0, [_a], void 0, function* ({ company, file, baseUrl, body, isExcelFile = false, }) {
    // const companyDetails: ICompanyModel | any = await CompanyModel.findOne({
    //   company,
    //   recordDeleted: false,
    // });
    // if (!companyDetails) {
    //   throw new Error('Company not found');
    // }
    const bucketSize = yield (0, service_1.getTotalSize)(`${company}/`);
    // if (
    //   companyDetails.plan.storageLimitInGb * 1024 * 1024 * 1024 <=
    //   bucketSize + file.size
    // ) {
    //   throw new Error(
    //     `Your usage has hit the ${companyDetails.plan.storageLimitInGb} GB Free plan limit.
    //   Contact ${Config.supportEmail} for assistance.`,
    //   );
    // }
    let name;
    let folderName;
    const fileExtension = isExcelFile
        ? "xlsx"
        : file.originalname.match(/\.([^.]+)$/)[1];
    const validBaseUrls = [
        "/quiz-hub",
        "/cabinet",
        // '/questionnaire',
        "/evidence",
        "/artifacts",
        "/recommended-standard",
    ];
    if (baseUrl === "/questionnaire") {
        name = yield (0, service_1.cleanFilename)(body.data.name);
        folderName = `${company}${baseUrl}/${name}-${new Date().toLocaleDateString("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            //   timeZone: companyDetails.timeZone,
        })}_${new Date()
            .toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            //   timeZone: companyDetails.timeZone,
        })
            .replace(/:/g, "")}.${fileExtension}`;
    }
    else if (validBaseUrls.includes(baseUrl)) {
        name = yield (0, exports.getUniqueFileName)({
            name: body.data.name,
            parentId: body.data.parentId || null,
            company: String(body.data.company),
            isFolder: body.isFolder || false,
            isEvidence: baseUrl === "/evidence",
            isArtifacts: baseUrl === "/artifacts",
            isRecommendedStandard: baseUrl === "/recommended-standard",
        });
        // name = await S3BucketService.cleanFilename(body.data.name);
        folderName = `${company}${baseUrl}/${new Date().valueOf()}-${name}.${fileExtension}`;
    }
    else {
        throw new Error(`Invalid baseUrl: ${baseUrl}`);
    }
    const fileLocation = yield (0, service_1.uploadFile)(folderName, file.buffer, file.mimetype);
    return fileLocation;
});
exports.handleUpload2 = handleUpload2;
