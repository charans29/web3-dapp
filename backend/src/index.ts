import express from "express"
import userRouter from "./routers/user"
import workerRouter from "./routers/worker"

const app = express();
app.use(express.json());

export const JWT_SECRET = "SECRET";

app.use("/v1/user", userRouter);
app.use("/v1/worker", workerRouter);

app.listen(3000);