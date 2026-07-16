const path = require('path');
const os = require('os');
const fs = require('fs');

// Set up temp SQLite DB and a deterministic secret before any app code loads.
const dbPath = path.join(os.tmpdir(), `auth-integration-${Date.now()}.db`);
delete process.env.MYSQL_HOST;
process.env.JWT_SECRET = 'test-secret';

const {
    KnexUserRepository,
} = require('../../src/repository/KnexUserRepository');
const { getKnexConfig } = require('../../src/repository/knexConfig');
const { AuthService } = require('../../src/service/AuthService');
const { default: createApp } = require('../../src/app');
const request = require('supertest');

const repository = new KnexUserRepository(getKnexConfig(dbPath));
const service = new AuthService(repository);
const app = createApp(service);

beforeAll(async () => {
    await service.init();
});

afterAll(async () => {
    await service.teardown();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
});

describe('auth lifecycle', () => {
    const email = 'integration@example.com';
    const password = 'password123';
    let cookie;

    test('GET /api/auth/health', async () => {
        const res = await request(app).get('/api/auth/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    test('POST /api/auth/register creates an account', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email, password });
        expect(res.status).toBe(201);
        expect(res.headers['set-cookie']).toBeDefined();
        expect(res.body.user.email).toBe(email);
        expect(res.body.user.passwordHash).toBeUndefined();
    });

    test('POST /api/auth/register rejects a duplicate', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email, password });
        expect(res.status).toBe(409);
    });

    test('POST /api/auth/login returns a token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email, password });
        expect(res.status).toBe(200);
        cookie = res.headers['set-cookie'];
        expect(cookie).toBeDefined();
    });

    test('POST /api/auth/logout clears the auth cookie', async () => {
        const res = await request(app).post('/api/auth/logout');
        expect(res.status).toBe(204);
        expect(res.headers['set-cookie']).toBeDefined();
        expect(res.headers['set-cookie'][0]).toContain('auth_token=');
        expect(res.headers['set-cookie'][0]).toContain(
            'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        );
    });

    test('POST /api/auth/login rejects bad credentials (401)', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email, password: 'wrongpass1' });
        expect(res.status).toBe(401);
    });

    test('GET /api/auth/me requires a token (401)', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });

    test('GET /api/auth/me returns the profile', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', cookie);
        expect(res.status).toBe(200);
        expect(res.body.email).toBe(email);
    });

    test('GET /api/auth/me/export returns the user data', async () => {
        const res = await request(app)
            .get('/api/auth/me/export')
            .set('Cookie', cookie);
        expect(res.status).toBe(200);
        expect(res.body.email).toBe(email);
        expect(res.headers['content-disposition']).toContain('my-data.json');
    });

    test('PUT /api/auth/me updates the password', async () => {
        const res = await request(app)
            .put('/api/auth/me')
            .set('Cookie', cookie)
            .send({ password: 'newpassword1' });
        expect(res.status).toBe(200);

        const login = await request(app)
            .post('/api/auth/login')
            .send({ email, password: 'newpassword1' });
        expect(login.status).toBe(200);
    });

    test('DELETE /api/auth/me erases the account', async () => {
        const res = await request(app)
            .delete('/api/auth/me')
            .set('Cookie', cookie);
        expect(res.status).toBe(204);

        const login = await request(app)
            .post('/api/auth/login')
            .send({ email, password: 'newpassword1' });
        expect(login.status).toBe(401);
    });
});
