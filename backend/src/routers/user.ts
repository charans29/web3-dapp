import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken"
import { S3Client } from '@aws-sdk/client-s3'
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { JWT_SECRET } from "../config";
import { authMiddleware } from "../middleware";
import { createTaskInput } from "../types";
import nacl from "tweetnacl";
import { Connection, PublicKey } from "@solana/web3.js";

const router = Router();
const prismaClient = new PrismaClient();
const s3Client = new S3Client({
    credentials: {
        accessKeyId: "PRESIGNED_USER_ID",
        secretAccessKey: "PRESIGNED_USER_KEY"
    },
    region: "us-east-2"
})

const DEFAULT_TITLE = "Select the most clickable thumbnail";
const connection = new Connection("YOUR_RPC_API_KEY")

router.get("/task", authMiddleware, async (req, res) => {
    //@ts-ignore
    const taskId: string = req.query.taskId;
    //@ts-ignore
    const userId: string = req.userId;
     
    const taskDetails  = await prismaClient.task.findFirst({
        where: {
            user_id: Number(userId),
            id: Number(taskId)
        },
        include: {
            options: true
        }
    })

    if(!taskDetails) {
        return res.status(411).json({
            message: "access restricted"
        })
    }

    const response = await prismaClient.submission.findMany({
        where: {
            task_id: Number(taskId),
        },
        include: {
            option:true
        }
    })

    const result: Record<string, {
        count: number,
        option: {
            imgUrl: string
        }
    }> = {};

    taskDetails.options.forEach(option => {
        result[option.id] = {
            count:1,
            option: {
                imgUrl: option.img_url
            }
        }
    })

    response.forEach(r => {
        result[r.option_id].count++;
    });

    res.json({
        result,
        taskDetails
    })

})

router.post("/task", authMiddleware, async (req, res) => {
    const body = req.body;
    const parseResult = createTaskInput.safeParse(body);
    // @ts-ignore
    const userId = req.userId;

    if (!parseResult.success) {
        return res.status(411).json({
            message: "you've sent the wrong inputs"
        });
    }

    const user = await prismaClient.user.findFirst({
        where: {
            id: userId
        }
    })

    const transaction = await connection.getTransaction(parseResult.data.signature, {
        maxSupportedTransactionVersion: 1
    });

    if ((transaction?.meta?.postBalances[1] ?? 0) - (transaction?.meta?.preBalances[1] ?? 0) !== 100000000) {
        return res.status(411).json({
            message: "Transaction signature/amount incorrect"
        })
    }

    if (transaction?.transaction.message.getAccountKeys().get(1)?.toString() !== "PARENT_ADDRESS") {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        })
    }

    if (transaction?.transaction.message.getAccountKeys().get(0)?.toString() !== user?.address) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        })
    }

    const response = await prismaClient.$transaction(async (tx) => {
        const task = await tx.task.create({
            data: {
                title: parseResult.data.title || DEFAULT_TITLE ,
                amount: 1,
                sign: parseResult.data.signature,
                user_id: userId
            }
        });

        await tx.option.createMany({
            data: parseResult.data.options.map(option => ({
                img_url: option.imgUrl,
                task_id: task.id
            }))
        });

        return task;
    });

    res.json({
        id: response.id
    });

});

router.get("/presignedUrl", authMiddleware, async(req,res) => {
    //@ts-ignore
    const userId = req.userId

    const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: 'usr-bucket',
        Key: `files/${userId}/${Math.random()}/img.jpg`,
        Conditions: [
          ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Fields: {
          'Content-Type': 'image/png'
        },
        Expires: 3600
      })
      
      console.log({ url, fields })

    res.json({
        preSignedUrl: url,
        fields
    })
})

router.post("/signin", async(req, res) => {
    const {publicKey, sign} = req.body;
    const message = new TextEncoder().encode("Sign to Auth mechanical Tasks");
    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(sign.data),
        new PublicKey(publicKey).toBytes()
    )

    if (!result) {
        return res.status(411).json({
            message: "Incorrect signature"
        })
    }

    const userExist = await prismaClient.user.findFirst({
        where: {
            address: publicKey
        }
    })

    if(userExist){
        const token = jwt.sign({
            userId: userExist.id
        }, JWT_SECRET)
        res.json({
            token
        })
    } else {
        const user = await prismaClient.user.create({
            data: {
                address: publicKey
            }
        })
        const token = jwt.sign({
            userId: user.id
        }, JWT_SECRET)
        res.json({
            token
        })
    } 
});

export default router;