import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken"
import { workerMiddleware } from "../middleware";
import { JWT_WORKER_SECRET } from "../config";

const router = Router();
const prismaClient = new PrismaClient();

router.get("/nextTask", workerMiddleware, async (req, res) => {
    //@ts-ignore
    const workerId = req.workerId;
    
    const task = await prismaClient.task.findFirst({
        where: {
            done: false,
            submissions:{
                none: {
                    worker_id: workerId
                }
            }
        },
        select: {
            options: true,
            title:true
        }
    })

    if(!task) {
        return res.status(411).json({
            message:"no tasks left 4 u 2 review"
        })
    } else {
        return res.status(411).json({
            task
        })
    }
})

router.post("/signin", async (req, res) => {
    const getAddress = "Bom5Qu6ijkJiaVKG74qZpLx1aH8sdGxnCqftcZ913Wne"
    const workerExist = await prismaClient.worker.findFirst({
        where: {
            address: getAddress
        }
    })

    if(workerExist){
        const token = jwt.sign({
            workerId: workerExist.id
        }, JWT_WORKER_SECRET)
        res.json({
            token
        })
    } else {
        const worker = await prismaClient.worker.create({
            data: {
                address: getAddress,
                pending_amt: 0,
                locked_amt: 0
            }
        })
        const token = jwt.sign({
            workerId: worker.id
        }, JWT_WORKER_SECRET)
        res.json({
            token
        })
    } 
});

export default router;