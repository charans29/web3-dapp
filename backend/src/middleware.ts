import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from ".";

export function authMiddlewrre(req: Request, res:Response, next:NextFunction) {
    const authHEader =  req.headers["authorization"] ?? ""

    try{
        const decoded = jwt.verify(authHEader, JWT_SECRET)
        //@ts-ignore
        if (decoded.userId) {
            //@ts-ignore
            req.userId = decoded.userId;
            return next();
        }
    } catch(e) {
        return res.status(403).json({
            message: "your not logged in" 
        })
    }
}