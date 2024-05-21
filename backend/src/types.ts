import z from "zod";

export const createTaskInput = z.object({
    options: z.array(z.object({
        imgUrl: z.string()
    })),
    title: z.string().optional(),
    signature: z.string()
});  

export const createSubmissionsInput = z.object({
    taskId: z.string(),
    selection: z.string()
}); 