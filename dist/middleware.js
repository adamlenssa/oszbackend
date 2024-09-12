"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowCrossDomain = exports.paramsIdCheck = exports.getTokenData = exports.errorHandleMiddleware = exports.LoginParse = exports.frontendUrl = exports.backendUrl = void 0;
const zod_1 = require("zod");
const auth_1 = require("./auth");
exports.backendUrl = "https://oromosoundz.xyz/";
exports.frontendUrl = "https://www.oromosoundz.com/";
exports.LoginParse = zod_1.z.object({
    username: zod_1.z.string(),
    role: zod_1.z.enum(["admin", "listner"]),
    id: zod_1.z.number(),
    iat: zod_1.z.number(),
    exp: zod_1.z.number(),
});
const errorHandleMiddleware = (err, _req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) => {
    if (err instanceof zod_1.ZodError) {
        const errMessage = err.issues[0].message;
        console.log(errMessage);
        return res.status(400).send({ message: errMessage });
    }
    console.error(err.message);
    return res.status(500).send(err.message);
};
exports.errorHandleMiddleware = errorHandleMiddleware;
const getTokenData = (req) => {
    const { headers } = req;
    const { authorization } = headers;
    if (!authorization)
        throw new Error("Unauthorized");
    const [, token] = authorization.split(" ");
    const verifiedToken = (0, auth_1.comapreToken)(token);
    return verifiedToken;
};
exports.getTokenData = getTokenData;
const paramsIdCheck = (req, _res, next) => {
    const { params: { id }, } = req;
    if (!id)
        throw new Error("No id present");
    const numId = +id;
    if (isNaN(numId))
        throw new Error("Not a valid ID");
    next();
};
exports.paramsIdCheck = paramsIdCheck;
const allowCrossDomain = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
};
exports.allowCrossDomain = allowCrossDomain;
//# sourceMappingURL=middleware.js.map