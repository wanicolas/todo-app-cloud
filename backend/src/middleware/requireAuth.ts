import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as fs from 'fs';

// Verifies the JWT stored in the `auth_token` cookie (same shared secret as the auth service),
// then attaches the authenticated user id to req.userId. No network call.
export default function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).send({ error: 'Authentication required' });
    }

    let secret = 'dev-insecure-secret';
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
        }
    } else if (process.env.JWT_SECRET) {
        secret = process.env.JWT_SECRET;
    } else if (process.env.NODE_ENV === 'production') {
        throw new Error('Critical: JWT secret is missing in production.');
    }

    try {
        const payload = jwt.verify(token, secret);
        const sub =
            typeof payload === 'string'
                ? undefined
                : (payload as jwt.JwtPayload).sub;
        if (typeof sub !== 'string' || sub.length === 0) {
            return res.status(401).send({ error: 'Invalid or expired token' });
        }
        (req as any).userId = sub;
        next();
    } catch {
        return res.status(401).send({ error: 'Invalid or expired token' });
    }
}
