import { Schema, Types } from "mongoose";
import {
  cleanFilename,
  getTotalSize,
  uploadFile,
} from "../config/bucket/service";

export const getUniqueFileName = async ({
  name,
//   parentId,
  company,
  isFolder,
  isEvidence = false,
  isArtifacts = false,
  isRecommendedStandard = false,
}: {
  name: string;
//   parentId: string | null;
  company: string;
  isFolder: boolean;
  isEvidence?: boolean;
  isArtifacts?: boolean;
  isRecommendedStandard?: boolean;
}): Promise<string> => {
    console.log("name---->", name);
    console.log("company---->", company);
    console.log("isFolder---->", isFolder);
  const baseName = name?.replace(/\(\d+\)(?=\.[^.]*$|$)/, "").trim();
  console.log("baseName---->", baseName);

  const extension = name?.includes(".")
    ? name?.substring(name?.lastIndexOf("."))
    : "";
  console.log("extension---->", extension);
  const nameWithoutExt = name?.includes(".")
    ? baseName.substring(0, baseName.lastIndexOf("."))
    : baseName;
  console.log("nameWithoutExt---->", nameWithoutExt);

  let counter = 0;
  let newName = name;
  let fileExists = true;

  while (fileExists) {
    const query: any = {
      name: newName,
      company: new Types.ObjectId(company),
      recordDeleted: false,
      isFolder,
    };

    // if (parentId) {
    //   query.parentId = new Types.ObjectId(parentId);
    // } else {
    //   query.parentId = null;
    // }

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
    } else {
      counter += 1;
      newName = `${nameWithoutExt}(${counter})${extension}`;
    }
  }

  return newName;
};

export const handleUpload2 = async ({
  company,
  file,
  baseUrl,
  body,
  isExcelFile = false,
}: {
  company: Schema.Types.ObjectId | string;
  file: any;
  baseUrl: any;
  body: any;
  isExcelFile?: boolean;
}) => {
  // const companyDetails: ICompanyModel | any = await CompanyModel.findOne({
  //   company,
  //   recordDeleted: false,
  // });
  // if (!companyDetails) {
  //   throw new Error('Company not found');
  // }
  const bucketSize = await getTotalSize(`${company}/`);

  // if (
  //   companyDetails.plan.storageLimitInGb * 1024 * 1024 * 1024 <=
  //   bucketSize + file.size
  // ) {
  //   throw new Error(
  //     `Your usage has hit the ${companyDetails.plan.storageLimitInGb} GB Free plan limit.
  //   Contact ${Config.supportEmail} for assistance.`,
  //   );
  // }

  let name: string | any;
  let folderName: string;
  const fileExtension = isExcelFile
    ? "xlsx"
    : file.originalname.match(/\.([^.]+)$/)[1];

  const validBaseUrls = [
    "/quiz-hub",
    "/cabinet",
    // "/api",
    // '/questionnaire',
    "/evidence",
    "/artifacts",
    "/recommended-standard",
  ];

  if (baseUrl === "/questionnaire") {
    name = await cleanFilename(body.data.name);
    folderName = `${company}${baseUrl}/${name}-${new Date().toLocaleDateString(
      "en-CA",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        //   timeZone: companyDetails.timeZone,
      }
    )}_${new Date()
      .toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        //   timeZone: companyDetails.timeZone,
      })
      .replace(/:/g, "")}.${fileExtension}`;
  } else if (validBaseUrls.includes(baseUrl)) {
    name = await getUniqueFileName({
      name: file.originalname,
    //   parentId: body.data.parentId || null,
      company: String(company),
      isFolder: body.isFolder || false,
      isEvidence: baseUrl === "/evidence",
      isArtifacts: baseUrl === "/artifacts",
      isRecommendedStandard: baseUrl === "/recommended-standard",
    });
    console.log("name--->", name);

    // name = await S3BucketService.cleanFilename(body.data.name);
    folderName = `${company}${baseUrl}/${new Date().valueOf()}-${name}.${fileExtension}`;
    console.log("folderName--->", folderName);
  } else {
    throw new Error(`Invalid baseUrl: ${baseUrl}`);
  }

  const fileLocation = await uploadFile(folderName, file.buffer, file.mimetype);
  console.log("fileLocation--->", fileLocation);

  return fileLocation;
};
