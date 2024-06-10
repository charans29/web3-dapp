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
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = require("bs58");
const SecretKey_1 = require("../SecretKey");
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
const TOTAL_SUBMISSIONS = 100;
const connection = new web3_js_1.Connection("https://solana-devnet.g.alchemy.com/v2/gUUVFEHELGvNCdd3yinJfxI6m9ioZomO");
router.post("/payout", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const workerId = req.workerId;
    const SOL = req.body.SOL;
    console.log("SOLSOSLSOSLSOLSOSLOSLSOSLSO: ", SOL);
    yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedWorker = yield tx.worker.update({
            where: {
                id: workerId
            },
            data: {
                pending_amt: {
                    decrement: SOL
                },
                locked_amt: {
                    increment: SOL
                }
            }
        });
        if (!updatedWorker) {
            throw new Error('Worker not found');
        }
        const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: new web3_js_1.PublicKey("3vKYs772uGosyd78k6G5AZExTEz1M9NkFqvkQHRNbHep"),
            toPubkey: new web3_js_1.PublicKey(updatedWorker.address),
            lamports: 1000000000 * SOL / TOTAL_SUBMISSIONS,
        }));
        const keypair = web3_js_1.Keypair.fromSecretKey((0, bs58_1.decode)(SecretKey_1.SK));
        let signature = "";
        try {
            signature = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [keypair]);
        }
        catch (e) {
            return res.json({
                message: "SOL Transaction failed"
            });
        }
        yield tx.payout.create({
            data: {
                worker_id: workerId,
                amount: updatedWorker.pending_amt,
                status: "processing",
                signature,
            },
        });
    })).catch((error) => {
        console.error('Transaction failed:', error);
        res.status(500).json({ message: "Transaction failed" });
        return null;
    });
    const wrkr = yield prismaClient.worker.findFirst({
        where: {
            id: workerId
        }
    });
    res.json({
        message: "Success",
        amount: wrkr === null || wrkr === void 0 ? void 0 : wrkr.pending_amt
    });
    // const transaction = new Transaction().add(
    //     SystemProgram.transfer({
    //         fromPubkey: new PublicKey("3vKYs772uGosyd78k6G5AZExTEz1M9NkFqvkQHRNbHep"),
    //         toPubkey: new PublicKey(worker.address),
    //         lamports: 1000_000_000 * worker.pending_amt / TOTAL_SUBMISSIONS,
    //     })
    // );
    // const keypair = Keypair.fromSecretKey(decode(SK));
    // let signature = "";
    // try {
    //     signature = await sendAndConfirmTransaction(
    //         connection,
    //         transaction,
    //         [keypair],
    //     );
    //  } catch(e) {
    //     return res.json({
    //         message: "Transaction failed"
    //     })
    //  }
    // await prismaClient.$transaction(async tx => {
    //     await tx.worker.update({
    //         where: {
    //             id: workerId
    //         },
    //         data: {
    //             pending_amt: {
    //                 decrement: worker.pending_amt
    //             },
    //             locked_amt: {
    //                 increment: worker.pending_amt
    //             }
    //         }
    //     });
    //     await tx.payout.create({
    //         data: {
    //             worker_id: workerId,
    //             amount: worker.pending_amt,
    //             status: "processing",
    //             signature: signature
    //         }
    //     });
    // });
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
        pendingAmount: worker === null || worker === void 0 ? void 0 : worker.pending_amt,
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
        yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.submission.create({
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
        res.json({
            task
        });
    }
}));
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { publicKey, sign } = req.body;
    const message = new TextEncoder().encode("Sign to Auth for work on mechanical Tasks");
    const result = tweetnacl_1.default.sign.detached.verify(message, new Uint8Array(sign.data), new web3_js_1.PublicKey(publicKey).toBytes());
    if (!result) {
        return res.status(411).json({
            message: "Incorrect signature"
        });
    }
    const workerExist = yield prismaClient.worker.findFirst({
        where: {
            address: publicKey
        }
    });
    if (workerExist) {
        const token = jsonwebtoken_1.default.sign({
            workerId: workerExist.id
        }, config_1.JWT_WORKER_SECRET);
        res.json({
            token,
            amount: workerExist.pending_amt / TOTAL_SUBMISSIONS
        });
    }
    else {
        const worker = yield prismaClient.worker.create({
            data: {
                address: publicKey,
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
