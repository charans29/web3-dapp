"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubmissionsInput = exports.createTaskInput = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createTaskInput = zod_1.default.object({
    options: zod_1.default.array(zod_1.default.object({
        imgUrl: zod_1.default.string()
    })),
    title: zod_1.default.string().optional(),
    signature: zod_1.default.string()
});
exports.createSubmissionsInput = zod_1.default.object({
    taskId: zod_1.default.string(),
    selection: zod_1.default.string()
});
