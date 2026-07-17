import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as fs from 'fs';

// Extracts and verifies the auth_token cookie, then attaches the user id to req.userId.
export default function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const token = req.cookies?.auth_token;

    if (!token) {
        return res.status(401).send({ error: 'Authentication required' });
    }

    try {
        let secret: string;
        if (process.env.JWT_SECRET_FILE) {
            try {
                secret = fs
                    .readFileSync(process.env.JWT_SECRET_FILE, 'utf8')
                    .trim();
            } catch (err) {
                if (process.env.NODE_ENV === 'production') {
                    throw new Error(
                        'Critical: JWT secret file is unreadable in production.',
                        { cause: err },
                    );
                }
                secret = 'dev-insecure-secret';
            }
        } else if (process.env.JWT_SECRET) {
            secret = process.env.JWT_SECRET;
        } else {
            if (process.env.NODE_ENV === 'production') {
                throw new Error(
                    'Critical: JWT secret is missing in production.',
                );
            }
            secret = 'dev-insecure-secret';
        }

        const payload = jwt.verify(token, secret) as jwt.JwtPayload;
        (req as Request & { userId: string }).userId = payload.sub as string;
        next();
    } catch {
        return res.status(401).send({ error: 'Invalid or expired token' });
    }
}
