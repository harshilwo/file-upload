import { NextFunction, Request, Response } from "express";
import crypto from "crypto";

export const checkUploadTimeStamp = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("req.query----->", req.query);
    console.log("req.params----->", req.params);
    console.log("req.body.data----->", req.body);
    const { auth_signature, auth_timestamp } = req.query;
    const { companyId, type } = req.params;

    if (!type || !companyId || !auth_signature || !auth_timestamp) {
      return res.status(400).json({ error: "Missing file metadata" });
    }

    const timestamp = Date.now() / 1000;

    if (
      timestamp < Number(auth_timestamp) ||
      timestamp - Number(auth_timestamp) > 15
    ) {
      throw new Error(
        `Authorization failed as timestamp not matched: ${timestamp}, ${auth_timestamp}`
      );
    }

    next();
  } catch (error: any) {
    console.log("error in checkValidFileUpload---", error);
    return res.status(401).json({ error: error.message || "Unauthorized" });
  }
};

/**
 * @param {Object} request: request object
 * @param {Object} response: response object
 * @param {Function} next: Middleware function to execute next task
 * @description API signature validator middleware
 */
export const hashMiddleware = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const { auth_key, auth_signature, auth_timestamp } = request.query;
  const { companyId, type } = request.params;
  const appConfig: any = {
    authKey: process.env.AUTH_KEY,
    appSecret: process.env.FILE_UPLOAD_SECRET,
    appId: companyId,
  };

  console.log("appConfig----->", appConfig);

  console.log("request.file----->", request.file);
  try {
    if (
      appConfig.authKey !== auth_key ||
      !checkAuthSignature(
        appConfig,
        auth_signature,
        auth_timestamp,
        {
          body: {
            mimeType: request.file?.mimetype,
            size: request.file?.size,
            fileName: request.file?.originalname,
            type: type,
          },
          path: request.baseUrl + request.path,
          method: request.method,
          query: request.query,
        },
        request
      )
    ) {
      throw new Error(`Authorization failed at step ${!appConfig ? "1" : "2"}`);
    } else {
      next();
    }
  } catch (e) {
    console.log("error in hash middleware--->", e);
    return response
      .status(401)
      .send({ status: "failed", error: "Authorization failed." });
  }
};

/**
 * @param {Object} config: Application config
 * @param {String} auth_signature: Auth signature from request
 * @param {String} auth_timestamp: Auth timestamp from request
 * @param {Object} { body, path, method }: body, path and method from request object
 * @description Helper function to check auth signature hash by generating hash
 */
const checkAuthSignature = (
  config: any,
  auth_signature: any,
  auth_timestamp: any,
  { body, path, method, query }: any,
  request: Request
) => {
  try {
    const RESERVED_QUERY_KEYS: any = {
      appId: true,
      auth_key: true,
      auth_timestamp: true,
      auth_version: true,
      auth_signature: true,
      body_md5: true,
    };

    const timestamp = Date.now() / 1000;
    if (timestamp < auth_timestamp || timestamp - auth_timestamp > 15) {
      throw new Error(
        `Authorization failed as timestamp not matched: ${timestamp}, ${auth_timestamp}`
      );
    }
    const params: any = {
      appId: config.appId,
      auth_key: config.authKey,
      auth_timestamp: auth_timestamp,
      auth_version: "1.0",
    };
    console.log("params----->", params);
    if (query) {
      for (const key in query) {
        if (!RESERVED_QUERY_KEYS[key]) {
          params[key] = query[key];
        }
      }
    }
    console.log("body----->", body);
    request.body = body;

    if (body) {
      params.body_md5 = getMD5(JSON.stringify(toOrderedArray(body)));
    }

    const sortedKeyVal = toOrderedArray(params);
    let queryString = sortedKeyVal.join("&");
    const signData = [method.toUpperCase(), path, queryString].join("\n");
    console.log("config----->", config);
    const hash = signToken(signData, config.appSecret);
    console.log("hash----->", hash);
    console.log("auth_signature----->", auth_signature);

    if (hash !== auth_signature) {
      throw new Error(
        `Authorization failed as hash not matched: ${hash}, ${auth_signature}`
      );
    }
    return true;
  } catch (e) {
    throw new Error(e as string);
  }
};
/**
 * @param {Object} body: Body data
 * @description Function to get MD5 code
 * @returns {String} MD5 hash
 */
function getMD5(body: any) {
  return crypto.createHash("md5").update(body, "utf8").digest("hex");
}
/**
 * @param {Object} map: params object
 * @description Helper function to sort params order
 * @returns {String} params key value
 */
function toOrderedArray(map: any) {
  return Object.keys(map)
    .map(function (key) {
      return [key, map[key]];
    })
    .sort(function (a, b) {
      if (a[0] < b[0]) {
        return -1;
      }
      if (a[0] > b[0]) {
        return 1;
      }
      return 0;
    })
    .map(function (pair) {
      return pair[0] + "=" + pair[1];
    });
}
/**
 * @param {String} stringData: data
 * @param {String} secret: Application secret
 * @description Helper function to sign token by app secret
 * @return {String} signToken
 */
const signToken = (stringData: any, secret: any) => {
  return crypto
    .createHmac("sha256", secret)
    .update(Buffer.from(stringData))
    .digest("hex");
};
