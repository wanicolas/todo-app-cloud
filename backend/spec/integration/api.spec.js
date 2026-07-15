const path = require('path');
const os = require('os');
const fs = require('fs');

// Set up temp SQLite DB and a deterministic JWT secret before any app code loads
const dbPath = path.join(os.tmpdir(), `todo-integration-${Date.now()}.db`);
delete process.env.MYSQL_HOST;
process.env.JWT_SECRET = 'test-secret';

const jwt = require('jsonwebtoken');
const { KnexRepository } = require('../../src/repository/KnexRepository');
const { getKnexConfig } = require('../../src/repository/knexConfig');
const { TodoService } = require('../../src/service/TodoService');
const createApp = require('../../src/app').default || require('../../src/app');
const request = require('supertest');

const repository = new KnexRepository(getKnexConfig(dbPath));
const service = new TodoService(repository);
const app = createApp(service);

const knex = require('knex');
const testDb = knex(getKnexConfig(dbPath));

const token = jwt.sign({ sub: 'user-1' }, 'test-secret');
const otherToken = jwt.sign({ sub: 'user-2' }, 'test-secret');
const auth = (t = token) => ({ Cookie: `auth_token=${t}` });

beforeAll(async () => {
    await service.init();
});

beforeEach(async () => {
    await testDb('todo_items').del();
});

afterAll(async () => {
    await testDb.destroy();
    await service.teardown();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
});

describe('GET /api/greeting', () => {
    test('returns greeting (public)', async () => {
        const res = await request(app).get('/api/greeting');
        expect(res.status).toBe(200);
        expect(res.body.greeting).toBe('Hello world!');
    });
});

describe('authentication', () => {
    test('GET /api/items without a token returns 401', async () => {
        const res = await request(app).get('/api/items');
        expect(res.status).toBe(401);
    });

    test('GET /api/items with an invalid token returns 401', async () => {
        const res = await request(app)
            .get('/api/items')
            .set({ Cookie: 'auth_token=not-a-jwt' });
        expect(res.status).toBe(401);
    });
});

describe('CRUD /api/items', () => {
    test('GET /api/items returns empty array initially', async () => {
        const res = await request(app).get('/api/items').set(auth());
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('POST /api/items creates an item', async () => {
        const res = await request(app)
            .post('/api/items')
            .set(auth())
            .send({ name: 'Buy milk' })
            .set('Content-Type', 'application/json');
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Buy milk');
        expect(res.body.completed).toBe(false);
        expect(res.body.id).toBeDefined();
    });

    test('GET /api/items returns the created item', async () => {
        await request(app)
            .post('/api/items')
            .set(auth())
            .send({ name: 'Buy milk' });
        const res = await request(app).get('/api/items').set(auth());
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Buy milk');
    });

    test('another user does not see the item', async () => {
        await request(app)
            .post('/api/items')
            .set(auth())
            .send({ name: 'Buy milk' });
        const res = await request(app).get('/api/items').set(auth(otherToken));
        expect(res.body).toEqual([]);
    });

    test('PUT /api/items/:id updates an item', async () => {
        const createRes = await request(app)
            .post('/api/items')
            .set(auth())
            .send({ name: 'Buy milk' });
        const createdItemId = createRes.body.id;
        const res = await request(app)
            .put(`/api/items/${createdItemId}`)
            .set(auth())
            .send({ name: 'Buy milk', completed: true })
            .set('Content-Type', 'application/json');
        expect(res.status).toBe(200);
        expect(res.body.completed).toBe(true);
    });

    test('DELETE /api/items/:id removes an item', async () => {
        const createRes = await request(app)
            .post('/api/items')
            .set(auth())
            .send({ name: 'Buy milk' });
        const createdItemId = createRes.body.id;
        const res = await request(app)
            .delete(`/api/items/${createdItemId}`)
            .set(auth());
        expect(res.status).toBe(200);
    });

    test('GET /api/items is empty after deletion', async () => {
        const createRes = await request(app)
            .post('/api/items')
            .set(auth())
            .send({ name: 'Buy milk' });
        const createdItemId = createRes.body.id;
        await request(app).delete(`/api/items/${createdItemId}`).set(auth());
        const res = await request(app).get('/api/items').set(auth());
        expect(res.body).toEqual([]);
    });

    test('DELETE /api/items purges all items of the user', async () => {
        await request(app).post('/api/items').set(auth()).send({ name: 'One' });
        await request(app).post('/api/items').set(auth()).send({ name: 'Two' });

        const del = await request(app).delete('/api/items').set(auth());
        expect(del.status).toBe(200);

        const res = await request(app).get('/api/items').set(auth());
        expect(res.body).toEqual([]);
    });
});
