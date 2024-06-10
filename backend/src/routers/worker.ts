import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken"
import { workerMiddleware } from "../middleware";
import { JWT_WORKER_SECRET } from "../config";
import { getNextTask } from "../db";
import { createSubmissionsInput } from "../types";
import nacl from "tweetnacl";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { decode } from "bs58";
import { SK } from "../SecretKey";

const router = Router();
const prismaClient = new PrismaClient();
const TOTAL_SUBMISSIONS = 100;
const connection = new Connection("YOUR_RPC_API_KEY")

router.post("/payout", workerMiddleware, async (req, res) => {
    //@ts-ignore
    const workerId = req.workerId;
    const SOL = req.body.SOL;

    await prismaClient.$transaction(async (tx) => {
        const updatedWorker = await tx.worker.update({
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

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: new PublicKey("YOUR_PARENT_WALLET_ADDRESS"),
                toPubkey: new PublicKey(updatedWorker.address),
                lamports: 1000_000_000 *  SOL/ TOTAL_SUBMISSIONS,
            })
        );
        
        const keypair = Keypair.fromSecretKey(decode(SK));

        let signature = "";
        try {
            signature = await sendAndConfirmTransaction(
                connection,
                transaction,
                [keypair],
            );
        } catch(e) {
            return res.json({
                message: "SOL Transaction failed"
            })
        }

        await tx.payout.create({
            data: {
                worker_id: workerId,
                amount: updatedWorker.pending_amt, 
                status: "processing",
                signature, 
            },
        });
    }).catch((error) => {
        console.error('Transaction failed:', error);
        res.status(500).json({ message: "Transaction failed" });
        return null;
    });
    
    const wrkr = await prismaClient.worker.findFirst({
        where: {
            id: workerId
        }
    });
   
    res.json({
        message: "Success",
        amount: wrkr?.pending_amt
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
        pendingAmount: worker?.pending_amt,
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
        await prismaClient.$transaction(async tx => {
            await tx.submission.create({
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
    const {publicKey, sign} = req.body;
    const message = new TextEncoder().encode("Sign to Auth for work on mechanical Tasks");
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
    const workerExist = await prismaClient.worker.findFirst({
        where: {
            address: publicKey
        }
    })
    if(workerExist){
        const token = jwt.sign({
            workerId: workerExist.id
        }, JWT_WORKER_SECRET)
     
        res.json({
            token,
            amount: workerExist.pending_amt / TOTAL_SUBMISSIONS
        })
    } else {
        const worker = await prismaClient.worker.create({
            data: {
                address: publicKey,
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