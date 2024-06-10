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
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
const config_1 = require("../config");
const middleware_1 = require("../middleware");
const types_1 = require("../types");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const web3_js_1 = require("@solana/web3.js");
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
const s3Client = new client_s3_1.S3Client({
    credentials: {
        accessKeyId: "AKIA3FLDYLQPPLJECTVC",
        secretAccessKey: "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"
    },
    region: "us-east-2"
});
const DEFAULT_TITLE = "Select the most clickable thumbnail";
const connection = new web3_js_1.Connection("https://solana-devnet.g.alchemy.com/v2/gUUVFEHELGvNCdd3yinJfxI6m9ioZomO");
router.get("/task", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const taskId = req.query.taskId;
    //@ts-ignore
    const userId = req.userId;
    const taskDetails = yield prismaClient.task.findFirst({
        where: {
            user_id: Number(userId),
            id: Number(taskId)
        },
        include: {
            options: true
        }
    });
    if (!taskDetails) {
        return res.status(411).json({
            message: "access restricted"
        });
    }
    const response = yield prismaClient.submission.findMany({
        where: {
            task_id: Number(taskId),
        },
        include: {
            option: true
        }
    });
    const result = {};
    taskDetails.options.forEach(option => {
        result[option.id] = {
            count: 1,
            option: {
                imgUrl: option.img_url
            }
        };
    });
    response.forEach(r => {
        result[r.option_id].count++;
    });
    res.json({
        result,
        taskDetails
    });
}));
router.post("/task", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const body = req.body;
    const parseResult = types_1.createTaskInput.safeParse(body);
    // @ts-ignore
    const userId = req.userId;
    if (!parseResult.success) {
        return res.status(411).json({
            message: "you've sent the wrong inputs"
        });
    }
    const user = yield prismaClient.user.findFirst({
        where: {
            id: userId
        }
    });
    const transaction = yield connection.getTransaction(parseResult.data.signature, {
        maxSupportedTransactionVersion: 1
    });
    if (((_b = (_a = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _a === void 0 ? void 0 : _a.postBalances[1]) !== null && _b !== void 0 ? _b : 0) - ((_d = (_c = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _c === void 0 ? void 0 : _c.preBalances[1]) !== null && _d !== void 0 ? _d : 0) !== 100000000) {
        return res.status(411).json({
            message: "Transaction signature/amount incorrect"
        });
    }
    if (((_e = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(1)) === null || _e === void 0 ? void 0 : _e.toString()) !== "3vKYs772uGosyd78k6G5AZExTEz1M9NkFqvkQHRNbHep") {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        });
    }
    if (((_f = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(0)) === null || _f === void 0 ? void 0 : _f.toString()) !== (user === null || user === void 0 ? void 0 : user.address)) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        });
    }
    const response = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const task = yield tx.task.create({
            data: {
                title: parseResult.data.title || DEFAULT_TITLE,
                amount: 1,
                sign: parseResult.data.signature,
                user_id: userId
            }
        });
        yield tx.option.createMany({
            data: parseResult.data.options.map(option => ({
                img_url: option.imgUrl,
                task_id: task.id
            }))
        });
        return task;
    }));
    res.json({
        id: response.id
    });
}));
router.get("/presignedUrl", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const { url, fields } = yield (0, s3_presigned_post_1.createPresignedPost)(s3Client, {
        Bucket: 'usr-bucket',
        Key: `files/${userId}/${Math.random()}/img.jpg`,
        Conditions: [
            ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Fields: {
            'Content-Type': 'image/png'
        },
        Expires: 3600
    });
    console.log({ url, fields });
    res.json({
        preSignedUrl: url,
        fields
    });
}));
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { publicKey, sign } = req.body;
    const message = new TextEncoder().encode("Sign to Auth mechanical Tasks");
    const result = tweetnacl_1.default.sign.detached.verify(message, new Uint8Array(sign.data), new web3_js_1.PublicKey(publicKey).toBytes());
    if (!result) {
        return res.status(411).json({
            message: "Incorrect signature"
        });
    }
    const userExist = yield prismaClient.user.findFirst({
        where: {
            address: publicKey
        }
    });
    if (userExist) {
        const token = jsonwebtoken_1.default.sign({
            userId: userExist.id
        }, config_1.JWT_SECRET);
        res.json({
            token
        });
    }
    else {
        const user = yield prismaClient.user.create({
            data: {
                address: publicKey
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id
        }, config_1.JWT_SECRET);
        res.json({
            token
        });
    }
}));
exports.default = router;
