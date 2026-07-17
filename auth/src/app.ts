import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import requireAuth from './middleware/requireAuth';
import makeRegister from './routes/register';
import makeLogin from './routes/login';
import makeLogout from './routes/logout';
import makeGetMe from './routes/getMe';
import makeUpdateMe from './routes/updateMe';
import makeDeleteMe from './routes/deleteMe';
import makeExportMe from './routes/exportMe';
import { AuthService } from './service/AuthService';

export default function createApp(service: AuthService) {
    const app = express();

    app.set('trust proxy', 1);
    app.use(helmet());
    app.use(cookieParser());
    app.use(express.json());

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: 'Too many requests from this IP, please try again later',
        skip: () => process.env.NODE_ENV !== 'production',
    });

    // Liveness/readiness probe target.
    app.get('/api/auth/health', (_req, res) => res.send({ status: 'ok' }));

    // Public endpoints.
    app.post('/api/auth/register', authLimiter, makeRegister(service));
    app.post('/api/auth/login', authLimiter, makeLogin(service));
    app.post('/api/auth/logout', makeLogout());

    // Protected endpoints (RGPD account management).
    app.get('/api/auth/me', requireAuth, makeGetMe(service));
    app.put('/api/auth/me', requireAuth, makeUpdateMe(service));
    app.delete('/api/auth/me', requireAuth, makeDeleteMe(service));
    app.get('/api/auth/me/export', requireAuth, makeExportMe(service));

    return app;
}
