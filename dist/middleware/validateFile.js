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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashMiddleware = exports.checkValidFileUpload = void 0;
const crypto_1 = __importDefault(require("crypto"));
const checkValidFileUpload = (req, res, next) => {
    try {
        const { auth_signature, auth_timestamp } = req.query;
        const { companyId, type } = req.params;
        if (!type || !companyId || !auth_signature || !auth_timestamp) {
            return res.status(400).json({ error: "Missing file metadata" });
        }
        const timestamp = Date.now() / 1000;
        if (timestamp < Number(auth_timestamp) ||
            timestamp - Number(auth_timestamp) > 15) {
            throw new Error(`Authorization failed as timestamp not matched: ${timestamp}, ${auth_timestamp}`);
        }
        next();
    }
    catch (error) {
        console.log("error in checkValidFileUpload---", error);
        return res.status(401).json({ error: error.message || "Unauthorized" });
    }
};
exports.checkValidFileUpload = checkValidFileUpload;
/**
 * @param {Object} request: request object
 * @param {Object} response: response object
 * @param {Function} next: Middleware function to execute next task
 * @description API signature validator middleware
 */
const hashMiddleware = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { auth_key, auth_signature, auth_timestamp } = request.query;
    const { companyId, type } = request.params;
    const appConfig = {
        authKey: process.env.AUTH_KEY,
        appSecret: process.env.FILE_UPLOAD_SECRET,
        appId: companyId,
    };
    try {
        //get app config by auth key and app id
        // parsed formDate
        // filename from the uploaded file
        //Check for the filesize and file mime type by running the signature check
        if (appConfig.authKey !== auth_key ||
            !checkAuthSignature(appConfig, auth_signature, auth_timestamp, {
                body: {
                    mimeType: (_a = request.file) === null || _a === void 0 ? void 0 : _a.mimetype,
                    size: (_b = request.file) === null || _b === void 0 ? void 0 : _b.size,
                    fileName: (_c = request.file) === null || _c === void 0 ? void 0 : _c.originalname,
                    type: type,
                },
                path: request.baseUrl + request.path,
                method: request.method,
                query: request.query,
            })) {
            throw new Error(`Authorization failed at step ${!appConfig ? "1" : "2"}`);
        }
        else {
            next();
        }
    }
    catch (e) {
        console.log("error in hash middleware--->", e);
        return response
            .status(401)
            .send({ status: "failed", error: "Authorization failed." });
    }
});
exports.hashMiddleware = hashMiddleware;
/**
 * @param {Object} config: Application config
 * @param {String} auth_signature: Auth signature from request
 * @param {String} auth_timestamp: Auth timestamp from request
 * @param {Object} { body, path, method }: body, path and method from request object
 * @description Helper function to check auth signature hash by generating hash
 */
const checkAuthSignature = (config, auth_signature, auth_timestamp, { body, path, method, query }) => {
    try {
        const RESERVED_QUERY_KEYS = {
            appId: true,
            auth_key: true,
            auth_timestamp: true,
            auth_version: true,
            auth_signature: true,
            body_md5: true,
        };
        const timestamp = Date.now() / 1000;
        if (timestamp < auth_timestamp || timestamp - auth_timestamp > 15) {
            throw new Error(`Authorization failed as timestamp not matched: ${timestamp}, ${auth_timestamp}`);
        }
        const params = {
            appId: config.appId,
            auth_key: config.authKey,
            auth_timestamp: auth_timestamp,
            auth_version: "1.0",
        };
        if (query) {
            for (const key in query) {
                if (!RESERVED_QUERY_KEYS[key]) {
                    params[key] = query[key];
                }
            }
        }
        if (body) {
            params.body_md5 = getMD5(JSON.stringify(toOrderedArray(body)));
        }
        const sortedKeyVal = toOrderedArray(params);
        let queryString = sortedKeyVal.join("&");
        const signData = [method.toUpperCase(), path, queryString].join("\n");
        const hash = signToken(signData, config.appSecret);
        if (hash !== auth_signature) {
            throw new Error(`Authorization failed as hash not matched: ${hash}, ${auth_signature}`);
        }
        return true;
    }
    catch (e) {
        throw new Error(e);
    }
};
/**
 * @param {Object} body: Body data
 * @description Function to get MD5 code
 * @returns {String} MD5 hash
 */
function getMD5(body) {
    return crypto_1.default.createHash("md5").update(body, "utf8").digest("hex");
}
/**
 * @param {Object} map: params object
 * @description Helper function to sort params order
 * @returns {String} params key value
 */
function toOrderedArray(map) {
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
const signToken = (stringData, secret) => {
    return crypto_1.default
        .createHmac("sha256", secret)
        .update(Buffer.from(stringData))
        .digest("hex");
};
