const { TodoService } = require('../../src/service/TodoService');
const {
    InMemoryRepository,
} = require('../../src/repository/InMemoryRepository');

let service;

beforeEach(async () => {
    const repository = new InMemoryRepository();
    service = new TodoService(repository);
    await service.init();
});

afterEach(async () => {
    await service.teardown();
});

test('addItem creates an item with id and name', async () => {
    const item = await service.addItem('Buy milk');

    expect(item.id).toBeDefined();
    expect(item.name).toBe('Buy milk');
    expect(item.completed).toBe(false);
});

test('getAllItems returns all stored items', async () => {
    await service.addItem('Item 1');
    await service.addItem('Item 2');

    const items = await service.getAllItems();
    expect(items.length).toBe(2);
});

test('updateItem updates and returns the item', async () => {
    const created = await service.addItem('Buy milk');

    const updated = await service.updateItem(created.id, {
        name: 'Buy oat milk',
        completed: true,
    });

    expect(updated.name).toBe('Buy oat milk');
    expect(updated.completed).toBe(true);
});

test('removeItem deletes the item', async () => {
    const created = await service.addItem('Buy milk');

    await service.removeItem(created.id);

    const items = await service.getAllItems();
    expect(items.length).toBe(0);
});
