import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken"
import { S3Client } from '@aws-sdk/client-s3'
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { JWT_SECRET } from "..";
import { authMiddlewrre } from "../middleware";


const router = Router();
const prismaClient = new PrismaClient();
const s3Client = new S3Client({
    credentials: {
        accessKeyId: "USER ACCES ID",
        secretAccessKey: "USER ACCESSS KEY"
    },
    region: "us-east-2"
})

router.get("/presignedUrl", authMiddlewrre, async(req,res) => {
    //@ts-ignore
    const userId = req.userId

    const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: 'third-web-dapp',
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
    const getAddress = "GPDfrK6pBmtqastvh9tha5LS4yrktenTC3oet4ZVMBRK"
    const userExist = await prismaClient.user.findFirst({
        where: {
            address: getAddress
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
                address: getAddress
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