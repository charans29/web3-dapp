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
const express_1 = require("express");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middleware_1 = require("../middleware");
const config_1 = require("../config");
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
router.get("/nextTask", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const workerId = req.workerId;
    const task = yield prismaClient.task.findFirst({
        where: {
            done: false,
            submissions: {
                none: {
                    worker_id: workerId
                }
            }
        },
        select: {
            options: true,
            title: true
        }
    });
    console.log(task);
    if (!task) {
        return res.status(411).json({
            message: "no tasks left 4 u 2 review"
        });
    }
    else {
        return res.status(411).json({
            task
        });
    }
}));
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const getAddress = "Bom5Qu6ijkJiaVKG74qZpLx1aH8sdGxnCqftcZ913Wne";
    const workerExist = yield prismaClient.worker.findFirst({
        where: {
            address: getAddress
        }
    });
    if (workerExist) {
        const token = jsonwebtoken_1.default.sign({
            workerId: workerExist.id
        }, config_1.JWT_WORKER_SECRET);
        res.json({
            token
        });
    }
    else {
        const worker = yield prismaClient.worker.create({
            data: {
                address: getAddress,
                pending_amt: 0,
                locked_amt: 0
            }
        });
        const token = jsonwebtoken_1.default.sign({
            workerId: worker.id
        }, config_1.JWT_WORKER_SECRET);
        res.json({
            token
        });
    }
}));
exports.default = router;
