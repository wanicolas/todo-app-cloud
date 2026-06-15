import { Request, Response, NextFunction } from 'express';

const jwt = require('jsonwebtoken');

// Verifies the Bearer JWT with the shared secret (same as the auth service),
// then attaches the authenticated user id to req.userId. No network call.
function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).send({ error: 'Authentication required' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'dev-insecure-secret';
        const payload = jwt.verify(token, secret);
        (req as any).userId = payload.sub;
        next();
    } catch {
        return res.status(401).send({ error: 'Invalid or expired token' });
    }
}

module.exports = requireAuth;
