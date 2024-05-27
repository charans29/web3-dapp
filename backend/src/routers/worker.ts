import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken"
import { workerMiddleware } from "../middleware";
import { JWT_WORKER_SECRET } from "../config";
import { getNextTask } from "../db";
import { createSubmissionsInput } from "../types";

const router = Router();
const prismaClient = new PrismaClient();
const TOTAL_SUBMISSIONS = 100;

router.post("/payout", workerMiddleware, async (req, res) => {
    //@ts-ignore
    const workerId = req.workerId;

    const worker = await prismaClient.worker.findFirst({
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

    await prismaClient.$transaction(async tx => {
        await tx.worker.update({
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

        await tx.payout.create({
            data: {
                worker_id: workerId,
                amount: worker.pending_amt,
                status: "processing",
                signature: txnId
            }
        });
    });

    res.json({
        message: "processing",
        amount: worker.pending_amt
    });
});


router.get("/balance", workerMiddleware, async (req, res) => {
    //@ts-ignore
    const workerId = req.workerId;
    const worker = await prismaClient.worker.findFirst({
        where: {
            id: workerId
        }
    })

    res.json({
        pendinAmount: worker?.pending_amt,
        lockedAmount: worker?.locked_amt
    })
})

router.post("/submissions", workerMiddleware, async (req, res) => {
    //@ts-ignore
    const workerId = req.workerId
    const paresedBody = createSubmissionsInput.safeParse(req.body);

    if(paresedBody.success){
        const task = await getNextTask(workerId);
        if(!task ||  task?.id !== Number(paresedBody.data.taskId)) {
            return res.status(411).json({
                message: "Incorrect TaskId"
            })   
        }
        
        const amount =  (task.amount/TOTAL_SUBMISSIONS)*1000;
        const submission = await prismaClient.$transaction(async tx => {
            const submission = await tx.submission.create({
                data: {
                    option_id: Number(paresedBody.data.selection),
                    worker_id: workerId,
                    task_id: Number(paresedBody.data.taskId),
                    amount
                }        
            })

            await tx.worker.update({
                where: {
                    id: workerId
                },
                data:{
                    pending_amt: {
                        increment: amount
                    }
                }
            })
            return submission;
        })

        const nextTask = await getNextTask(workerId)

        res.json({
            nextTask,
            amount
        })
    } else {
        res.status(411).json({
            message: "Incorrect Inputs"
        })
    }
})

router.get("/nextTask", workerMiddleware, async (req, res) => {
    //@ts-ignore
    const workerId = req.workerId;
    const task = await getNextTask(workerId);
    if(!task) {
        res.status(411).json({
            message:"no tasks left 4 u 2 review"
        })
    } else {
        res.json({
            task
        })
    }
})

router.post("/signin", async (req, res) => {
    const getAddress = "Bom5Qu6ijkJiaVKG74qZpLx1aH8sdGxnCqftcZ913Wne"
    // const getAddress = "GPDfrK6pBmtqastvh9tha5LS4yrktenTC3oet4ZVMBRK"
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