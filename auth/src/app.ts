import express from 'express';
import rateLimit from 'express-rate-limit';

const requireAuth = require('./middleware/requireAuth');
const makeRegister = require('./routes/register');
const makeLogin = require('./routes/login');
const makeGetMe = require('./routes/getMe');
const makeUpdateMe = require('./routes/updateMe');
const makeDeleteMe = require('./routes/deleteMe');
const makeExportMe = require('./routes/exportMe');

function createApp(service: any) {
    const app = express();

    app.use(express.json());

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: 'Too many requests from this IP, please try again later',
        skip: () => process.env.NODE_ENV === 'test',
    });

    // Liveness/readiness probe target.
    app.get('/api/auth/health', (_req, res) => res.send({ status: 'ok' }));

    // Public endpoints.
    app.post('/api/auth/register', authLimiter, makeRegister(service));
    app.post('/api/auth/login', authLimiter, makeLogin(service));

    // Protected endpoints (RGPD account management).
    app.get('/api/auth/me', requireAuth, makeGetMe(service));
    app.put('/api/auth/me', requireAuth, makeUpdateMe(service));
    app.delete('/api/auth/me', requireAuth, makeDeleteMe(service));
    app.get('/api/auth/me/export', requireAuth, makeExportMe(service));

    return app;
}

module.exports = createApp;
