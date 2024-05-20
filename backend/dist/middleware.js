"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
function authMiddleware(req, res, next) {
    var _a;
    const authHEader = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : "";
    try {
        const decoded = jsonwebtoken_1.default.verify(authHEader, config_1.JWT_SECRET);
        //@ts-ignore
        if (decoded.userId) {
            //@ts-ignore
            req.userId = decoded.userId;
            return next();
        }
    }
    catch (e) {
        return res.status(403).json({
            message: "your not logged in"
        });
    }
}
exports.authMiddleware = authMiddleware;
function workerMiddleware(req, res, next) {
    var _a;
    const authHEader = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : "";
    try {
        const decoded = jsonwebtoken_1.default.verify(authHEader, config_1.JWT_WORKER_SECRET);
        //@ts-ignore
        if (decoded.workerId) {
            //@ts-ignore
            req.workerId = decoded.workerId;
            return next();
        }
    }
    catch (e) {
        return res.status(403).json({
            message: "your not logged in"
        });
    }
}
exports.workerMiddleware = workerMiddleware;
