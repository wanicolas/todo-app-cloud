import express from 'express';

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

    // Liveness/readiness probe target.
    app.get('/api/auth/health', (_req, res) => res.send({ status: 'ok' }));

    // Public endpoints.
    app.post('/api/auth/register', makeRegister(service));
    app.post('/api/auth/login', makeLogin(service));

    // Protected endpoints (RGPD account management).
    app.get('/api/auth/me', requireAuth, makeGetMe(service));
    app.put('/api/auth/me', requireAuth, makeUpdateMe(service));
    app.delete('/api/auth/me', requireAuth, makeDeleteMe(service));
    app.get('/api/auth/me/export', requireAuth, makeExportMe(service));

    return app;
}

module.exports = createApp;
