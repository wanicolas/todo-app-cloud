const { TodoService } = require('../../src/service/TodoService');
const { KnexRepository } = require('../../src/repository/KnexRepository');
const { getKnexConfig } = require('../../src/repository/knexConfig');
const os = require('os');
const path = require('path');
const fs = require('fs');

process.env.MYSQL_HOST = '127.0.0.1';
process.env.MYSQL_PORT = '3306';
process.env.MYSQL_USER = 'root';
process.env.MYSQL_PASSWORD = 'secret';
process.env.MYSQL_DB = 'todos';

const USER = 'user-1';
const OTHER_USER = 'user-2';

let service;
const knex = require('knex');
const testDb = knex(getKnexConfig());

beforeEach(async () => {
    const repository = new KnexRepository(getKnexConfig());
    service = new TodoService(repository);
    await service.init();
    await testDb('todo_items').del();
});

afterEach(async () => {
    await service.teardown();
});

afterAll(async () => {
    await testDb.destroy();
});

test('addItem creates an item with id, name and userId', async () => {
    const item = await service.addItem(USER, 'Buy milk');

    expect(item.id).toBeDefined();
    expect(item.name).toBe('Buy milk');
    expect(item.completed).toBe(false);
    expect(item.userId).toBe(USER);
});

test('getAllItems returns only the items of the given user', async () => {
    await service.addItem(USER, 'Item 1');
    await service.addItem(USER, 'Item 2');
    await service.addItem(OTHER_USER, 'Not mine');

    const items = await service.getAllItems(USER);
    expect(items.length).toBe(2);
});

test('updateItem updates and returns the item', async () => {
    const created = await service.addItem(USER, 'Buy milk');

    const updated = await service.updateItem(USER, created.id, {
        name: 'Buy oat milk',
        completed: true,
    });

    expect(updated.name).toBe('Buy oat milk');
    expect(updated.completed).toBe(true);
});

test('removeItem deletes the item', async () => {
    const created = await service.addItem(USER, 'Buy milk');

    await service.removeItem(USER, created.id);

    const items = await service.getAllItems(USER);
    expect(items.length).toBe(0);
});

test('a user cannot see another user items', async () => {
    await service.addItem(OTHER_USER, 'Secret');

    const items = await service.getAllItems(USER);
    expect(items).toEqual([]);
});

test('removeAllForUser deletes only the given user items', async () => {
    await service.addItem(USER, 'Mine 1');
    await service.addItem(USER, 'Mine 2');
    await service.addItem(OTHER_USER, 'Theirs');

    await service.removeAllForUser(USER);

    expect(await service.getAllItems(USER)).toEqual([]);
    expect((await service.getAllItems(OTHER_USER)).length).toBe(1);
});
