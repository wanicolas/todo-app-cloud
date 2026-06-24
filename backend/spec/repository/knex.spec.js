const path = require('path');
const os = require('os');
const fs = require('fs');

const location = path.join(os.tmpdir(), `todo-knex-${Date.now()}.db`);

const { KnexRepository } = require('../../src/repository/KnexRepository');
const { getKnexConfig } = require('../../src/repository/knexConfig');

const USER = 'user-1';

const ITEM = {
    id: '7aef3d7c-d301-4846-8358-2a91ec9d6be3',
    name: 'Test',
    completed: false,
    userId: USER,
};

let db;
const mysqlHost = process.env.MYSQL_HOST;

beforeAll(() => {
    delete process.env.MYSQL_HOST;
});

beforeEach(async () => {
    if (fs.existsSync(location)) {
        fs.unlinkSync(location);
    }
    db = new KnexRepository(getKnexConfig(location));
    await db.init();
});

afterEach(async () => {
    await db.teardown();
});

afterAll(() => {
    if (mysqlHost) {
        process.env.MYSQL_HOST = mysqlHost;
    }
    if (fs.existsSync(location)) {
        fs.unlinkSync(location);
    }
});

test('it initializes correctly', async () => {
    const items = await db.getItems(USER);
    expect(items).toEqual([]);
});

test('it can store and retrieve items', async () => {
    await db.storeItem(ITEM);

    const items = await db.getItems(USER);
    expect(items.length).toBe(1);
    expect(items[0]).toEqual(ITEM);
});

test('it isolates items per user', async () => {
    await db.storeItem(ITEM);

    const items = await db.getItems('another-user');
    expect(items).toEqual([]);
});

test('it can update an existing item', async () => {
    await db.storeItem(ITEM);

    await db.updateItem(
        USER,
        ITEM.id,
        Object.assign({}, ITEM, { completed: !ITEM.completed }),
    );

    const items = await db.getItems(USER);
    expect(items.length).toBe(1);
    expect(items[0].completed).toBe(!ITEM.completed);
});

test('it can remove an existing item', async () => {
    await db.storeItem(ITEM);

    await db.removeItem(USER, ITEM.id);

    const items = await db.getItems(USER);
    expect(items.length).toBe(0);
});

test('it can get a single item', async () => {
    await db.storeItem(ITEM);

    const item = await db.getItem(USER, ITEM.id);
    expect(item).toEqual(ITEM);
});
