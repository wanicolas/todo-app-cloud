import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as fs from 'fs';

// Extracts and verifies the auth_token cookie, then attaches the user id to req.userId.
export default function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.auth_token;

    if (!token) {
        return res.status(401).send({ error: 'Authentication required' });
    }

    try {
        let secret = process.env.JWT_SECRET || 'dev-insecure-secret';
        if (process.env.JWT_SECRET_FILE) {
            secret = fs
                .readFileSync(process.env.JWT_SECRET_FILE, 'utf8')
                .trim();
        }
        const payload = jwt.verify(token, secret) as jwt.JwtPayload;
        (req as any).userId = payload.sub;
        next();
    } catch {
        return res.status(401).send({ error: 'Invalid or expired token' });
    }
}
