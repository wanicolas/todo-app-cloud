const path = require('path');
const os = require('os');
const fs = require('fs');

// Set SQLite to use a temp file before any app code loads
const dbPath = path.join(os.tmpdir(), `todo-integration-${Date.now()}.db`);
process.env.SQLITE_DB_LOCATION = dbPath;
delete process.env.MYSQL_HOST;

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/persistence');

beforeAll(async () => {
    await db.init();
});

afterAll(async () => {
    await db.teardown();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
});

describe('GET /api/greeting', () => {
    test('returns greeting', async () => {
        const res = await request(app).get('/api/greeting');
        expect(res.status).toBe(200);
        expect(res.body.greeting).toBe('Hello world!');
    });
});

describe('CRUD /api/items', () => {
    let createdItemId;

    test('GET /api/items returns empty array initially', async () => {
        const res = await request(app).get('/api/items');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('POST /api/items creates an item', async () => {
        const res = await request(app)
            .post('/api/items')
            .send({ name: 'Buy milk' })
            .set('Content-Type', 'application/json');
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Buy milk');
        expect(res.body.completed).toBe(false);
        expect(res.body.id).toBeDefined();
        createdItemId = res.body.id;
    });

    test('GET /api/items returns the created item', async () => {
        const res = await request(app).get('/api/items');
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Buy milk');
    });

    test('PUT /api/items/:id updates an item', async () => {
        const res = await request(app)
            .put(`/api/items/${createdItemId}`)
            .send({ name: 'Buy milk', completed: true })
            .set('Content-Type', 'application/json');
        expect(res.status).toBe(200);
        expect(res.body.completed).toBe(true);
    });

    test('DELETE /api/items/:id removes an item', async () => {
        const res = await request(app).delete(
            `/api/items/${createdItemId}`,
        );
        expect(res.status).toBe(200);
    });

    test('GET /api/items is empty after deletion', async () => {
        const res = await request(app).get('/api/items');
        expect(res.body).toEqual([]);
    });
});
