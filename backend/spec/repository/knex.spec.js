const path = require('path');
const os = require('os');
const fs = require('fs');

process.env.MYSQL_HOST = '127.0.0.1';
process.env.MYSQL_PORT = '3306';
process.env.MYSQL_USER = 'root';
process.env.MYSQL_PASSWORD = 'secret';
process.env.MYSQL_DB = 'todos';

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
const knex = require('knex');
const testDb = knex(getKnexConfig());

beforeEach(async () => {
    db = new KnexRepository(getKnexConfig());
    await db.init();
    await testDb('todo_items').del();
});

afterEach(async () => {
    await db.teardown();
});

afterAll(async () => {
    await testDb.destroy();
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
