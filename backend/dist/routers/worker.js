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
const db_1 = require("../db");
const types_1 = require("../types");
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
const TOTAL_SUBMISSIONS = 100;
router.post("/payout", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const workerId = req.workerId;
    const worker = yield prismaClient.worker.findFirst({
        where: {
            id: workerId
        }
    });
    if (!worker) {
        return res.json({
            message: "worker not found"
        });
    }
    const address = worker.address;
    const txnId = "0x123434";
    yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.worker.update({
            where: {
                id: workerId
            },
            data: {
                pending_amt: {
                    decrement: worker.pending_amt
                },
                locked_amt: {
                    increment: worker.pending_amt
                }
            }
        });
        yield tx.payout.create({
            data: {
                worker_id: workerId,
                amount: worker.pending_amt,
                status: "processing",
                signature: txnId
            }
        });
    }));
    res.json({
        message: "processing",
        amount: worker.pending_amt
    });
}));
router.get("/balance", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const workerId = req.workerId;
    const worker = yield prismaClient.worker.findFirst({
        where: {
            id: workerId
        }
    });
    res.json({
        pendinAmount: worker === null || worker === void 0 ? void 0 : worker.pending_amt,
        lockedAmount: worker === null || worker === void 0 ? void 0 : worker.locked_amt
    });
}));
router.post("/submissions", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const workerId = req.workerId;
    const paresedBody = types_1.createSubmissionsInput.safeParse(req.body);
    if (paresedBody.success) {
        const task = yield (0, db_1.getNextTask)(workerId);
        if (!task || (task === null || task === void 0 ? void 0 : task.id) !== Number(paresedBody.data.taskId)) {
            return res.status(411).json({
                message: "Incorrect TaskId"
            });
        }
        const amount = (task.amount / TOTAL_SUBMISSIONS) * 1000;
        const submission = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const submission = yield tx.submission.create({
                data: {
                    option_id: Number(paresedBody.data.selection),
                    worker_id: workerId,
                    task_id: Number(paresedBody.data.taskId),
                    amount
                }
            });
            yield tx.worker.update({
                where: {
                    id: workerId
                },
                data: {
                    pending_amt: {
                        increment: amount
                    }
                }
            });
            return submission;
        }));
        const nextTask = yield (0, db_1.getNextTask)(workerId);
        res.json({
            nextTask,
            amount
        });
    }
    else {
        res.status(411).json({
            message: "Incorrect Inputs"
        });
    }
}));
router.get("/nextTask", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const workerId = req.workerId;
    const task = yield (0, db_1.getNextTask)(workerId);
    if (!task) {
        res.status(411).json({
            message: "no tasks left 4 u 2 review"
        });
    }
    else {
        res.status(411).json({
            task
        });
    }
}));
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const getAddress = "Bom5Qu6ijkJiaVKG74qZpLx1aH8sdGxnCqftcZ913Wne";
    // const getAddress = "GPDfrK6pBmtqastvh9tha5LS4yrktenTC3oet4ZVMBRK"
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
